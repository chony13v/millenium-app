import React, { useRef, useState } from "react";
import { FlatList, View } from "react-native";
import DrawerLayout from "react-native-gesture-handler/DrawerLayout";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Academy from "@/components/home/Academy";
import Header from "@/components/Header";
import { useRouter } from "expo-router";
import DrawerContent from "@/components/DrawerContent";
import SignOutDialog from "@/components/SignOutDialog";
import CategoryIcons from "@/components/home/Category";
import News from "@/components/home/News";

export default function HomeScreen() {
  const drawerRef = useRef<DrawerLayout>(null);
  const router = useRouter();
  const [isSignOutVisible, setIsSignOutVisible] = useState(false);

  const handleCalendarPress = () => {
    router.push("/screens/CalendarScreen");
  };

  const handleProfilePress = () => {
    router.push("/screens/ProfileScreen");
  };

  const handleSettingsPress = () => {
    router.push("/screens/SettingsScreen");
  };

  const handleSignOutPress = () => {
    setIsSignOutVisible(true);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DrawerLayout
        ref={drawerRef}
        drawerWidth={250}
        drawerPosition="left"
        drawerType="slide"
        renderNavigationView={() => (
          <DrawerContent
            onCalendarPress={handleCalendarPress}
            onProfilePress={handleProfilePress}
            onSettingsPress={handleSettingsPress}
            onSignOutPress={handleSignOutPress}
          />
        )}
      >
        <View style={{ flex: 1 }}>
          <Header onMenuPress={() => drawerRef.current?.openDrawer()} />
          <FlatList
            data={[{ key: "home" }]}
            renderItem={() => (
              <>
                <CategoryIcons />
                <Academy />
                <News />
              </>
            )}
            keyExtractor={(item) => item.key}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        </View>
      </DrawerLayout>
      <SignOutDialog
        visible={isSignOutVisible}
        onClose={() => setIsSignOutVisible(false)}
      />
    </GestureHandlerRootView>
  );
}
