import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut, 
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { ProjectState } from './projectAutoSave';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file'
];

const provider = new GoogleAuthProvider();
DRIVE_SCOPES.forEach(scope => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account',
});

// Cache the access token in memory (never in localStorage/sessionStorage as required)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export interface DriveFileInfo {
  id: string;
  name: string;
  modifiedTime: string;
  size?: string;
  webViewLink?: string;
}

export interface GoogleDriveUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

/**
 * Initialize auth listener. Calls callback when user auth state changes.
 */
export const initGoogleDriveAuth = (
  onAuthChange: (user: GoogleDriveUser | null, hasToken: boolean) => void
) => {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      const userProfile: GoogleDriveUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      };
      onAuthChange(userProfile, cachedAccessToken !== null);
    } else {
      cachedAccessToken = null;
      onAuthChange(null, false);
    }
  });
};

/**
 * Interactive Sign-In with Google Drive OAuth Popup
 */
export const signInWithGoogleDrive = async (): Promise<{ user: GoogleDriveUser; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error('Kein Zugriffs-Token von Google erhalten.');
    }

    cachedAccessToken = credential.accessToken;
    
    const userProfile: GoogleDriveUser = {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
    };

    return { user: userProfile, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Drive Anmeldung fehlgeschlagen:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Get current in-memory cached access token
 */
export const getGoogleAccessToken = (): string | null => {
  return cachedAccessToken;
};

/**
 * Sign out and clear in-memory token
 */
export const signOutGoogleDrive = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

const DEFAULT_FILE_NAME = 'VoltCAD_AutoSave_Project.json';

/**
 * Find existing file by name in Google Drive
 */
export const findDriveFileByName = async (
  accessToken: string,
  fileName: string = DEFAULT_FILE_NAME
): Promise<DriveFileInfo | null> => {
  try {
    const query = encodeURIComponent(`name = '${fileName}' and trashed = false`);
    const fields = encodeURIComponent('files(id, name, modifiedTime, size, webViewLink)');
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&pageSize=1`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        cachedAccessToken = null;
        throw new Error('Google Drive Sitzung abgelaufen. Bitte neu anmelden.');
      }
      const errText = await res.text();
      throw new Error(`Fehler bei Google Drive Dateisuche (${res.status}): ${errText}`);
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0];
    }
    return null;
  } catch (error) {
    console.error('findDriveFileByName error:', error);
    throw error;
  }
};

/**
 * Uploads (create or update) a project state to Google Drive
 */
export const saveProjectToGoogleDrive = async (
  projectState: ProjectState,
  description: string = 'Automatisches Backup',
  fileName: string = DEFAULT_FILE_NAME
): Promise<{ fileId: string; webViewLink?: string; modifiedTime: string }> => {
  const token = cachedAccessToken;
  if (!token) {
    throw new Error('Nicht bei Google Drive angemeldet. Bitte melde dich an, um in Drive zu speichern.');
  }

  const payload = {
    app: 'VoltCAD 3D Pro',
    version: '2.0.0',
    timestamp: Date.now(),
    savedAtFormatted: new Date().toLocaleString('de-DE'),
    description,
    state: projectState,
  };

  const fileContent = JSON.stringify(payload, null, 2);

  // Check if file already exists
  const existingFile = await findDriveFileByName(token, fileName);

  if (existingFile) {
    // Update existing file (PATCH)
    const updateUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`;
    const res = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: fileContent,
    });

    if (!res.ok) {
      if (res.status === 401) {
        cachedAccessToken = null;
        throw new Error('Sitzung abgelaufen. Bitte neu bei Google Drive anmelden.');
      }
      throw new Error(`Google Drive Update fehlgeschlagen (${res.status})`);
    }

    const updatedData = await res.json();
    return {
      fileId: existingFile.id,
      webViewLink: existingFile.webViewLink,
      modifiedTime: updatedData.modifiedTime || new Date().toISOString(),
    };
  } else {
    // Create new file with multipart upload
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: fileName,
      mimeType: 'application/json',
      description: 'VoltCAD 3D CAD & Elektroplaner Projektdatei',
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      fileContent +
      closeDelimiter;

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!res.ok) {
      if (res.status === 401) {
        cachedAccessToken = null;
        throw new Error('Sitzung abgelaufen. Bitte neu bei Google Drive anmelden.');
      }
      const errText = await res.text();
      throw new Error(`Google Drive Datei-Erstellung fehlgeschlagen (${res.status}): ${errText}`);
    }

    const createdData = await res.json();
    return {
      fileId: createdData.id,
      webViewLink: createdData.webViewLink,
      modifiedTime: createdData.modifiedTime || new Date().toISOString(),
    };
  }
};

/**
 * List files created with this app in Google Drive
 */
export const listDriveProjectFiles = async (): Promise<DriveFileInfo[]> => {
  const token = cachedAccessToken;
  if (!token) return [];

  try {
    const query = encodeURIComponent(`trashed = false and mimeType = 'application/json'`);
    const fields = encodeURIComponent('files(id, name, modifiedTime, size, webViewLink)');
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=modifiedTime desc&pageSize=15`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        cachedAccessToken = null;
      }
      return [];
    }

    const data = await res.json();
    return data.files || [];
  } catch (error) {
    console.error('listDriveProjectFiles error:', error);
    return [];
  }
};

/**
 * Download and parse a project file from Google Drive
 */
export const loadProjectFromGoogleDrive = async (fileId: string): Promise<ProjectState> => {
  const token = cachedAccessToken;
  if (!token) {
    throw new Error('Nicht bei Google Drive angemeldet.');
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Laden aus Google Drive fehlgeschlagen (${res.status})`);
  }

  const json = await res.json();
  if (json.state) {
    return json.state as ProjectState;
  }
  // Fallback if saved directly as ProjectState
  return json as ProjectState;
};

/**
 * Delete a project file from Google Drive with explicit confirmation
 */
export const deleteProjectFromGoogleDrive = async (fileId: string): Promise<boolean> => {
  const token = cachedAccessToken;
  if (!token) throw new Error('Nicht angemeldet');

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.ok;
};
