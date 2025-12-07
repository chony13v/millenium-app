import React from "react";
import Dialog from "react-native-dialog";
import { useAuth } from "@clerk/clerk-expo";
import { signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "@/config/FirebaseConfig";

interface SignOutDialogProps {
  visible: boolean;
  onClose: () => void;
}

export default function SignOutDialog({
  visible,
  onClose,
}: SignOutDialogProps) {
  const { signOut } = useAuth();

  return (
    <Dialog.Container visible={visible}>
      <Dialog.Title>Cerrar Sesión </Dialog.Title>
      <Dialog.Description>¿Estás seguro?</Dialog.Description>
      <Dialog.Button label="Cancelar" onPress={onClose} />
      <Dialog.Button
        label="Salir"
        onPress={async () => {
          await firebaseSignOut(auth).catch(() => {});
          await signOut();
          onClose();
        }}
      />
    </Dialog.Container>
  );
}
