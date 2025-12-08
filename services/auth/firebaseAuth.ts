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
  // Si ya hay usuario y coincide (o no pudimos decodificar), no relinkear
  if (
    auth.currentUser &&
    (!clerkUid || auth.currentUser.uid === clerkUid)
  ) {
    return auth.currentUser;
  }

  // Si había otro usuario, cerramos sesión antes de firmar
  if (auth.currentUser && auth.currentUser.uid !== clerkUid) {
    await auth.signOut();
  }

  await signInWithCustomToken(auth, token);
  // Loguear una sola vez por sesión
  if (!linkClerkSessionToFirebase._logged) {
    console.log("✅ Sesión Firebase enlazada");
    (linkClerkSessionToFirebase as any)._logged = true;
  }

  return auth.currentUser;
}
