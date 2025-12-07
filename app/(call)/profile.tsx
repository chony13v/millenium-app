import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import Section1Form from "@/components/form/Section1Form";
import Section2Form from "@/components/form/Section2Form";
import Section3Form from "@/components/form/Section3Form";
import LoadingBall from "@/components/LoadingBall";
import TermsModal from "@/components/modals/TermsModal";
import PrivacyModal from "@/components/modals/PrivacyModal";
import CancelRegistrationPrompt from "@/components/profile/CancelRegistrationPrompt";
import ProfileRegistrationHero from "@/components/profile/ProfileRegistrationHero";
import ProfileStepper from "@/components/profile/ProfileStepper";
import UserSummaryCard from "@/components/profile/UserSummaryCard";
import { CITIES, POSITIONS } from "@/constants/formConstants";
import { useProfileRegistration } from "@/hooks/profile/useProfileRegistration";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const {
    currentSection,
    errors,
    handleCancelRegistration,
    handleFinalize,
    handlePreviousSection,
    isKeyboardVisible,
    isLoading,
    privacyModalVisible,
    section1,
    section2,
    section3,
    setPrivacyModalVisible,
    setTermsModalVisible,
    termsModalVisible,
    user,
    validateAndNext,
  } = useProfileRegistration();

  if (isLoading) {
    return (
      <View style={{ flex: 1 }}>
        <LoadingBall text="Verificando registro..." />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 6 }]}>
      <TermsModal
        visible={termsModalVisible}
        onClose={() => setTermsModalVisible(false)}
      />
      <PrivacyModal
        visible={privacyModalVisible}
        onClose={() => setPrivacyModalVisible(false)}
      />

      <ProfileStepper
        currentSection={currentSection}
        totalSections={3}
        title="Registro para el torneo selectivo"
        isKeyboardVisible={isKeyboardVisible}
      />

      <KeyboardAwareScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: 24 + insets.bottom },
        ]}
      >
        <ProfileRegistrationHero />

        <UserSummaryCard
          avatarUrl={user?.imageUrl}
          fullName={user?.fullName}
          email={user?.primaryEmailAddress?.emailAddress ?? null}
        />

        {currentSection === 1 && (
          <Section1Form
            nombreCompleto={section1.nombreCompleto}
            idNumber={section1.idNumber}
            birthDate={section1.birthDate}
            selectedPosition={section1.selectedPosition}
            selectedCity={section1.selectedCity}
            selectedDateTime={section1.selectedDateTime}
            informacionMedica={section1.informacionMedica}
            afiliacionEquipo={section1.afiliacionEquipo}
            errors={errors}
            dateTimes={section1.dateTimes}
            positions={POSITIONS}
            cities={CITIES}
            handleNombreCompletoChange={section1.setNombreCompleto}
            handleIdNumberChange={section1.setIdNumber}
            handleBirthDateChange={section1.handleBirthDateChange}
            handleSelectedPositionChange={({ key }) =>
              section1.setSelectedPosition(key)
            }
            handleCityChange={section1.handleCityChange}
            setSelectedDateTime={section1.setSelectedDateTime}
            handleInformacionMedicaChange={section1.setInformacionMedica}
            handleAfiliacionEquipoChange={section1.setAfiliacionEquipo}
            handleNextSection={validateAndNext}
          />
        )}

        {currentSection === 2 && (
          <Section2Form
            parentFullName={section2.parentFullName}
            relationship={section2.relationship}
            economicSituation={section2.economicSituation}
            parentPhoneNumber={section2.parentPhoneNumber}
            parentEmail={section2.parentEmail}
            errors={errors}
            handleParentFullNameChange={section2.setParentFullName}
            handleRelationshipChange={({ key }) =>
              section2.setRelationship(key)
            }
            handleEconomicSituationChange={({ key }) =>
              section2.setEconomicSituation(key)
            }
            handleParentPhoneNumberChange={section2.setParentPhoneNumber}
            handleParentEmailChange={section2.setParentEmail}
            handlePreviousSection={handlePreviousSection}
            validateAndNext={validateAndNext}
          />
        )}

        {currentSection === 3 && (
          <Section3Form
            consentimientoParticipacion={section3.consentimientoParticipacion}
            autorizacionFotos={section3.autorizacionFotos}
            acuerdoPrivacidad={section3.acuerdoPrivacidad}
            esRiobambeno={section3.esRiobambeno}
            errors={errors}
            setConsentimientoParticipacion={
              section3.setConsentimientoParticipacion
            }
            setAutorizacionFotos={section3.setAutorizacionFotos}
            setAcuerdoPrivacidad={section3.setAcuerdoPrivacidad}
            setEsRiobambeno={section3.setEsRiobambeno}
            setTermsModalVisible={setTermsModalVisible}
            setPrivacyModalVisible={setPrivacyModalVisible}
            handlePreviousSection={handlePreviousSection}
            validateSection3={section3.validateSection3}
            saveProfile={handleFinalize}
          />
        )}

        <CancelRegistrationPrompt onCancel={handleCancelRegistration} />
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingTop: 10,
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 14,
  },
});
