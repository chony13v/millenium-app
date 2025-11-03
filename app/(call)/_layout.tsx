import { Redirect, Tabs } from "expo-router";
import React from "react";
import { SafeAreaView, Image, View, Platform, StatusBar, Keyboard } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import {
  MaterialCommunityIcons,
  FontAwesome,
  FontAwesome6,
} from "@expo/vector-icons";
import { useWarmUpBrowser } from "@/components/SignInWithOAuth";

export default function CallRoutesLayout() {
  const { isSignedIn } = useAuth();
  const [isKeyboardVisible, setKeyboardVisible] = React.useState(false);
  useWarmUpBrowser();

  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  if (!isSignedIn) {
    return <Redirect href={"/(auth)/sign-in"} />;
  }

  const CustomTabIcon = ({
    focused,
    color,
    icon: Icon,
    iconName,
    size,
  }: {
    focused: boolean;
    color: string;
    icon: any;
    iconName: string;
    size: number;
  }) => {
    return (
      <View style={{ alignItems: "center" }}>
        {focused && (
          <View
            style={{
              position: "absolute",
              top: -8,
              width: 45,
              height: 3,
              backgroundColor: color,
              borderTopLeftRadius: 1,
              borderTopRightRadius: 1,
              borderBottomLeftRadius: 4,
              borderBottomRightRadius: 4,
            }}
          />
        )}
        <Icon name={iconName} size={size} color={color} />
      </View>
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, paddingBottom: 0, backgroundColor: "white" }}
    >
      <StatusBar barStyle="default" />
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={({ route }) => ({
            header: () => null,
            tabBarActiveTintColor: "#242c44",
            tabBarLabelStyle: {
              zIndex: 100,
              fontSize: 8,
              marginBottom: Platform.OS === "ios" ? 0 : -4,
            },
            tabBarStyle: {
              position: "relative",
              height: 45,
              marginBottom: 0,
              backgroundColor: "white",
              paddingBottom: Platform.OS === "ios" ? 15 : 5,
              display: isKeyboardVisible ? "none" : "flex",
            },
          })}
        >
          <Tabs.Screen
            name="home"
            options={{
              title: "COMUNIDAD",
              tabBarIcon: ({ color, focused }) => (
                <CustomTabIcon
                  focused={focused}
                  color={color}
                  icon={MaterialCommunityIcons}
                  iconName="home-city"
                  size={24}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="fields"
            options={{
              title: "CANCHAS",
              tabBarIcon: ({ color, focused }) => (
                <CustomTabIcon
                  focused={focused}
                  color={color}
                  icon={MaterialCommunityIcons}
                  iconName="soccer-field"
                  size={24}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="metodology"
            options={{
              title: "CLUB",
              headerTitle: "Club",
              tabBarIcon: ({ color, focused }) => (
                <CustomTabIcon
                  focused={focused}
                  color={color}
                  icon={FontAwesome}
                  iconName="soccer-ball-o"
                  size={24}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: "REGISTRO",
              headerTitle: "Registro para selectivo",
              tabBarIcon: ({ color, focused }) => (
                <CustomTabIcon
                  focused={focused}
                  color={color}
                  icon={FontAwesome6}
                  iconName="user-ninja"
                  size={24}
                />
              ),
            }}
          />
        </Tabs>
        <View
          style={{
            alignItems: "center",
            backgroundColor: "white",
            paddingTop: 2,
          }}
        >
          <View
            style={{
              width: "90%",
              height: 1,
              backgroundColor: "#E0E0E0",
              marginBottom: 2,
              marginTop: 2,
            }}
          />
          <Image
            source={require("../../assets/images/manabi_logo.png")}
            style={{
              width: 300,
              height: 30,
              resizeMode: "contain",
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
