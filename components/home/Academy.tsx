import {
  View,
  Text,
  Dimensions,
  Animated,
  StyleSheet,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Alert,
} from "react-native";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/config/FirebaseConfig";
import YoutubePlayer from "react-native-youtube-iframe";
import LoadingBall from "@/components/LoadingBall";

interface VideoItem {
  id: string;
  title: string;
  videoId: string; // Remove optional marker since we only use YouTube videos
}

const screenWidth = Dimensions.get("window").width;
const videoHeight = screenWidth * 0.9 * (9 / 16); // 16:9 aspect ratio

export default function Academy() {
  const [videoList, setVideoList] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const scrollX = new Animated.Value(0);
  const [videoErrors, setVideoErrors] = useState<{ [key: string]: boolean }>(
    {}
  );

  const onStateChange = useCallback((state: string) => {
    if (state === "ended") {
      setPlaying(false);
    }
  }, []);

  const onError = (error: string) => {
    console.error("YouTube Player Error:", error);
    setVideoErrors((prev) => ({ ...prev, [currentIndex]: true }));
  };

  useEffect(() => {
    getVideoList();
  }, []);

  const getVideoList = async () => {
    try {
      const q = query(collection(db, "Academy"));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log("No videos found in Academy collection");
        setVideoList([]);
        return;
      }

      const videos: VideoItem[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.videoId) {
          // Only add videos with videoId
          videos.push({
            id: doc.id,
            title: data.title,
            videoId: data.videoId,
          });
        }
      });
      setVideoList(videos);
    } catch (error) {
      console.error("Error fetching video data:", error);
      Alert.alert(
        "Error",
        "No se pudieron cargar los videos. Por favor intente más tarde.",
        [{ text: "OK" }]
      );
      setVideoList([]);
    } finally {
      setLoading(false);
    }
  };

  const onScroll = Platform.select({
    ios: Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
      useNativeDriver: false,
    }),
    android: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      scrollX.setValue(offsetX);
      setCurrentIndex(Math.round(offsetX / screenWidth));
    },
  });

  const renderVideoContent = (item: VideoItem, index: number) => {
    if (videoErrors[index]) {
      return (
        <View style={[styles.video, styles.fallbackContainer]}>
          <Text style={styles.errorIcon}>▶</Text>
          <Text style={styles.errorText}>Video unavailable</Text>
          <Text style={styles.retryText}>Please try again later</Text>
        </View>
      );
    }

    return (
      <YoutubePlayer
        height={videoHeight}
        width={screenWidth * 0.9}
        play={playing && currentIndex === index}
        videoId={item.videoId}
        onChangeState={onStateChange}
        onError={onError}
        webViewProps={{
          androidLayerType: Platform.OS === "android" ? "hardware" : undefined,
          allowsInlineMediaPlayback: true,
          mediaPlaybackRequiresUserAction: false,
          bounces: false,
        }}
        initialPlayerParams={{
          preventFullScreen: false,
          rel: false,
          showClosedCaptions: false,
          modestbranding: true,
          controls: true,
          iv_load_policy: 3,
        }}
      />
    );
  };

  const renderVideoItem = useCallback(
    ({ item, index }: { item: VideoItem; index: number }) => {
      const inputRange = [
        (index - 1) * screenWidth,
        index * screenWidth,
        (index + 1) * screenWidth,
      ];

      const scale = scrollX.interpolate({
        inputRange,
        outputRange: [0.8, 1, 0.8],
        extrapolate: "clamp",
      });

      return (
        <Animated.View
          style={[styles.videoContainer, { transform: [{ scale }] }]}
        >
          <View style={styles.playerContainer}>
            {renderVideoContent(item, index)}
            <Text style={styles.videoTitle}>{item.title}</Text>
          </View>
        </Animated.View>
      );
    },
    [currentIndex, playing, onStateChange, scrollX, videoErrors]
  );

  const renderIndicators = () => {
    return (
      <View style={styles.pagination}>
        {videoList.map((_, index) => {
          const inputRange = [
            (index - 1) * screenWidth,
            index * screenWidth,
            (index + 1) * screenWidth,
          ];

          const width = scrollX.interpolate({
            inputRange,
            outputRange: [15, 30, 15],
            extrapolate: "clamp",
          });

          const backgroundColor = scrollX.interpolate({
            inputRange,
            outputRange: ["#dbeafe", "#0ea5e9", "#dbeafe"],
            extrapolate: "clamp",
          });

          return (
            <Animated.View
              key={index}
              style={[styles.indicator, { width, backgroundColor }]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>2025 ACADEMIA CIUDAD FC</Text>
      {loading ? (
        <LoadingBall text="Cargando videos..." />
      ) : (
        <View style={styles.listContainer}>
          <Animated.FlatList
            data={videoList}
            horizontal={true}
            pagingEnabled
            snapToAlignment="center"
            snapToInterval={screenWidth}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={renderVideoItem}
            onScroll={onScroll}
            removeClippedSubviews={true}
            maxToRenderPerBatch={2}
            initialNumToRender={1}
            windowSize={3}
            onMomentumScrollEnd={
              Platform.OS === "ios"
                ? (event) => {
                    const newIndex = Math.floor(
                      event.nativeEvent.contentOffset.x / screenWidth
                    );
                    setCurrentIndex(newIndex);
                    setPlaying(false);
                  }
                : undefined
            }
            scrollEventThrottle={16}
          />
          {renderIndicators()}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  title: {
    fontFamily: "barlow-semibold",
    fontSize: 18,
    paddingLeft: 8,
    paddingTop: 6,
    color: "#0A2240",
  },
  loader: {
    marginTop: 20,
  },
  videoContainer: {
    width: screenWidth,
    height: videoHeight + 60,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  playerContainer: {
    width: screenWidth * 0.9,
    height: videoHeight,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#0A2240",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  video: {
    width: screenWidth * 0.9,
    height: videoHeight,
  },
  videoTitle: {
    color: "#0A2240",
    fontSize: 16,
    fontFamily: "barlow-medium",
    marginTop: 8,
    textAlign: "center",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },
  indicator: {
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 3,
  },
  listContainer: {
    marginBottom: 10,
  },
  fallbackContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  errorIcon: {
    fontSize: 40,
    color: "#666",
    marginBottom: 10,
  },
  errorText: {
    color: "#666",
    fontSize: 16,
    fontFamily: "barlow-medium",
  },
  retryText: {
    color: "#999",
    fontSize: 14,
    fontFamily: "barlow-regular",
    marginTop: 5,
  },
});
