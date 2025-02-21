import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  Button,
  Alert,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from "@clerk/clerk-expo";
import { generateUniqueNumber } from "@/utils/generateUniqueNumber";
import LoadingBall from "@/components/LoadingBall";
import { db } from "@/config/FirebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";

type Profile = {
  acuerdoPrivacidad: boolean;
  afiliacionEquipo: string;
  autorizacionFotos: boolean;
  birthDate: string;
  city?: string;
  consentimientoParticipacion: boolean;
  dateTime: string;
  edad?: number;
  email: string;
  fullName: string;
  idNumber?: string;
  imageUrl?: string;
  informacionMedica: string;
  parentEmail: string;
  parentFullName?: string;
  parentPhoneNumber: string;
  position: string;
  registrationDate: string;
  relationship: string;
  uniqueNumber?: string;
};
export default function ProfileScreen() {
  const { user } = useUser();
  const navigation = useNavigation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImageLoading, setIsImageLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const userRef = doc(db, "Participantes", user.id);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data() as Profile;

          // Check if user doesn't have a unique number
          if (!userData.uniqueNumber) {
            // Generate and assign unique number
            const uniqueNumber = await generateUniqueNumber();

            // Update Firestore
            await setDoc(
              userRef,
              {
                ...userData,
                uniqueNumber,
              },
              { merge: true }
            );

            // Update local state
            setProfile({
              ...userData,
              uniqueNumber,
            });
          } else {
            setProfile(userData);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleChangeImage = () => {
    Alert.alert(
      "Cambiar Imagen",
      "¿Deseas cambiar tu imagen de perfil?",
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Sí",
          onPress: () => pickImage(),
        },
      ],
      { cancelable: true }
    );
  };

  const pickImage = async () => {
    try {
      setIsImageLoading(true); // Start loading

      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso denegado",
          "Necesitas permisos para acceder a la galería."
        );
        setIsImageLoading(false);
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.5, // Compress to 50% quality
        base64: true,
      });

      if (!result.canceled && user) {
        // Resize the image to reduce size
        const manipResult = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 800 } }], // Resize width to 800px
          {
            compress: 0.5,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true,
          }
        );

        const base64 = `data:image/jpeg;base64,${manipResult.base64}`;
        console.log("Selected Image Base64 Length:", base64.length);

        // Check if base64 string exceeds Firestore limit (~1MB)
        if (base64.length > 1000000) {
          Alert.alert(
            "Error",
            "La imagen seleccionada es demasiado grande. Por favor, elige una imagen más pequeña."
          );
          setIsImageLoading(false);
          return;
        }

        try {
          await setDoc(
            doc(db, "Participantes", user.id),
            {
              imageUrl: base64,
            },
            { merge: true }
          );
          console.log("Firestore update successful for imageUrl.");

          const userRef = doc(db, "Participantes", user.id);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            setProfile(userDoc.data() as Profile);
            console.log("Profile refetched successfully.");
          }

          Alert.alert("Éxito", "Imagen de perfil actualizada correctamente.");
        } catch (error) {
          console.error("Error al actualizar la imagen en Firestore:", error);
          Alert.alert("Error", "No se pudo actualizar la imagen.");
        }
      } else {
        console.log("Image selection canceled or no user.");
      }
    } catch (error) {
      console.error("Error en pickImage:", error);
      Alert.alert("Error", "Ocurrió un error al seleccionar la imagen.");
    } finally {
      setIsImageLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#4630EB" />
          <LoadingBall text="Cargando perfil..." />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.backgroundContainer}>
          <View style={styles.card}>
            <TouchableOpacity onPress={handleChangeImage}>
              <Image source={{ uri: user?.imageUrl }} style={styles.avatar} />
            </TouchableOpacity>
            <Text style={styles.userName}>{user?.fullName}</Text>
            <Text style={styles.userEmail}>
              {user?.primaryEmailAddress?.emailAddress}
            </Text>
          </View>
          <View style={styles.outsideContainer}>
            <Text style={styles.registrationText}>
              Regístrate para actualizar tu perfil
            </Text>
            <Button title="Volver" onPress={() => navigation.goBack()} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
      >
            <View style={styles.headerBackground}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#000000" />
      </TouchableOpacity>
    </View>
        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.profileRow}>
              <View style={styles.leftColumn}>
                <View style={styles.avatarContainer}>
                  <TouchableOpacity
                    onPress={handleChangeImage}
                    disabled={isImageLoading}
                  >
                    <Image
                      source={{ uri: profile?.imageUrl || user?.imageUrl }}
                      style={styles.avatar}
                    />
                    {isImageLoading && (
                      <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="small" color="#ffffff" />
                      </View>
                    )}
                  </TouchableOpacity>
                  <Image
                    source={require("@/assets/images/verify.png")}
                    style={styles.checkIcon}
                  />
                  <Image
                    source={require("@/assets/images/logo_millenium.png")}
                    style={styles.logoIcon}
                  />
                </View>
                <Text style={styles.userName}>{profile.fullName}</Text>
                <Text style={styles.userEmail}>
                  {user?.primaryEmailAddress?.emailAddress}
                </Text>
                <View style={styles.cityContainer}>
                  <Image
                    source={require("@/assets/images/company.png")}
                    style={styles.cityIcon}
                  />
                  <Text style={styles.cityText}>{profile.city}</Text>
                </View>
              </View>
              <View style={styles.rightColumn}>
                <Text style={styles.position}>{profile.position}</Text>
                <View style={styles.separator} />
                <Text style={styles.age}>
                  {profile.edad ? `${profile.edad} años` : "N/A"}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.title}>Información de registro:</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Número de Participante:</Text>
            <Text style={[styles.infoValue, styles.uniqueNumber]}>
              {profile.uniqueNumber || "Generando..."}
            </Text>
          </View>

          <View style={styles.registrationInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Lugar y fecha de la prueba:</Text>
              <Text style={styles.infoValue}>{profile.dateTime}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Número de Identificación:</Text>
              <Text style={styles.infoValue}>{profile.idNumber}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Fecha de Nacimiento:</Text>
              <Text style={styles.infoValue}>{profile.birthDate}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Información médica</Text>
              <Text style={styles.infoValue}>{profile.informacionMedica}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nombre de Padre/Madre/Tutor:</Text>
              <Text style={styles.infoValue}>
                {profile.parentFullName} ({profile.relationship})
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Contacto:</Text>
              <Text style={styles.infoValue}>{profile.parentPhoneNumber}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Fecha de Registro:</Text>
              <Text style={styles.infoValue}>
                {profile.registrationDate.split("T")[0]}
              </Text>
            </View>
          </View>

          <View style={styles.logoBackground}>
            <Image
              source={require("@/assets/images/logo_alcaldiaRiobamba.png")}
              style={styles.logo}
            />
          </View>
          <Text style={styles.supportMessage}>
            Si deseas cambiar tu información, por favor contacta con soporte al
            siguiente número:
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loader: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerBackground: {
    backgroundColor: "#FFFFFF",
    height: 10,
    width: "100%",
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    marginLeft: 20,
    marginBottom: -70,
    marginTop: -60,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#ffffff",
    marginTop: -10,
  },
  container: {
    paddingTop: 20,
  },
  content: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: "barlow-semibold",
    marginBottom: 20,
    color: "#1a1a1a",
  },
  label: {
    fontSize: 16,
    fontFamily: "barlow-medium",
    marginBottom: 10,
    color: "#555",
  },
  value: {
    fontFamily: "barlow-regular",
    fontWeight: "normal",
    color: "#1a1a1a",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: "center",
    marginBottom: 20,
    marginTop: 40,
    borderWidth: 2,
    borderColor: "#4630EB",
    backgroundColor: "#ffffff",
  },
  supportMessage: {
    marginTop: 15,
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    fontFamily: "barlow-regular",
  },
  logoBackground: {
    backgroundColor: "#ffffff",
    width: "100%",
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 5,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  logo: {
    width: 200,
    height: 60,
    resizeMode: "contain",
  },
  importantBox: {
    marginVertical: 20,
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  importantLabel: {
    fontSize: 18,
    fontFamily: "barlow-medium",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 8,
  },
  importantValue: {
    fontSize: 20,
    fontFamily: "barlow-semibold",
    color: "#1a1a1a",
    textAlign: "center",
  },
  userName: {
    fontSize: 16,
    fontFamily: "barlow-semibold",
    color: "#333",
    marginTop: 8,
    textAlign: "left",
  },
  userEmail: {
    fontSize: 14,
    fontFamily: "outfit-regular",
    color: "#777",
    marginTop: 2,
    textAlign: "left",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  backgroundContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingVertical: 20,
  },
  card: {
    backgroundColor: "#ffffff",
    position: "relative",
    padding: 20,
    borderRadius: 16,
    marginTop: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
    maxWidth: 300,
    alignSelf: "center",
    transform: [{ perspective: 1000 }, { translateY: 2 }],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f5f5f5",
    marginBottom: 8,
  },
  buttonContainer: {
    padding: 16,
    marginTop: 10,
    alignItems: "center",
  },
  outsideContainer: {
    padding: 16,
    marginTop: 10,
    alignItems: "center",
  },
  registrationText: {
    fontSize: 16,
    color: "#1a1a1a",
    marginBottom: 16,
    textAlign: "center",
    fontFamily: "barlow-medium",
  },
  registrationInfo: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: "barlow-medium",
    color: "#1a1a1a",
    width: "40%",
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: "barlow-regular",
    color: "#1a1a1a",
  },
  profileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  leftColumn: {
    alignItems: "flex-start",
  },
  rightColumn: {
    alignItems: "center",
  },
  position: {
    fontSize: 14,
    fontFamily: "outfit-medium",
    color: "#4630EB",
    marginHorizontal: -10,
  },
  age: {
    fontSize: 13,
    fontFamily: "outfit-regular",
    color: "#000000",
    marginTop: 10,
  },
  separator: {
    height: 1,
    backgroundColor: "#f0f0f0",
    width: "100%",
  },
  cityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  cityText: {
    fontSize: 14,
    fontFamily: "outfit-medium",
    color: "#666",
  },
  cityIcon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },
  avatarContainer: {
    position: "relative",
    width: 80,
    height: 80,
  },
  checkIcon: {
    position: "absolute",
    width: 20,
    height: 20,
    bottom: 0,
    right: 0,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 80,
    height: 80,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  logoIcon: {
    position: "absolute",
    width: 20,
    height: 20,
    bottom: -75,
    right: -170,
  },
  uniqueNumber: {
    fontFamily: "barlow-semibold",
    fontSize: 16,
    color: "#4630EB",
  },
});
