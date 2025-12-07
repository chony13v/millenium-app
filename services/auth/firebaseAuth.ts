import { getAuth, signInWithCustomToken } from "firebase/auth";

const FIREBASE_TOKEN_TEMPLATE = "integration_firebase";

type GetTokenFn = (options: { template?: string }) => Promise<string | null>;

// Decodificador simple de JWT sin validación, solo para extraer uid
const parseJwt = (token: string): any => {
  try {
    const payload = token.split(".")[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

export async function linkClerkSessionToFirebase(getToken: GetTokenFn) {
  const auth = getAuth();
  const token = await getToken({ template: FIREBASE_TOKEN_TEMPLATE });

  if (!token) {
    throw new Error("No se recibió token de Firebase");
  }

  // Si ya estamos autenticados con el mismo UID, no reautenticar
  const decoded = parseJwt(token);
  const clerkUid = decoded?.sub || decoded?.uid || decoded?.user_id;
  if (auth.currentUser?.uid && auth.currentUser.uid === clerkUid) {
    return auth.currentUser;
  }

  // Si había otro usuario, cerramos sesión antes de firmar
  if (auth.currentUser && auth.currentUser.uid !== clerkUid) {
    await auth.signOut();
  }

  await signInWithCustomToken(auth, token);
  console.log("✅ Sesión Firebase enlazada");

  return auth.currentUser;
}
