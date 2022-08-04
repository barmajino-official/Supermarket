import { StyleSheet, Dimensions, TouchableOpacity, Image } from "react-native";
import { useEffect, useState } from "react";
import { Text, View } from "../components/Themed";
import { RootTabScreenProps } from "../types";

import firestore from "@react-native-firebase/firestore";
import { BarCodeScanner } from "expo-barcode-scanner";

const { width } = Dimensions.get("window");
const qrSize = width * 0.8;

export default function TabOneScreen({
  navigation,
}: RootTabScreenProps<"TabOne">) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(true);

  const getuser = async () => {
    const users = await firestore().collection("Users").get();
    return users;
  };

  const [restaurantsList, setRestaurantsList] = useState([]); //Initialise restaurant list with setter
  const [errorMessage, setErrorMessage] = useState("");

  //Call when component is rendered
  useEffect(() => {
    //getRestaurants();
    const unsubscribe = navigation.addListener("focus", () => {
      // do something - for example: reset states, ask for camera permission
      setHasPermission(null);
      (async () => {
        const { status } = await BarCodeScanner.requestPermissionsAsync();
        setHasPermission(status === "granted");
      })();
      setScanned(false);
    });

    // Return the function to unsubscribe from the event so it gets removed on unmount
    return unsubscribe;
  }, [navigation]);

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);

    await firestore()
      .collection("Products")
      .where("key", "==", data)
      .get()
      .then((querySnapshot) => {
        //console.log(querySnapshot.size);
        if (querySnapshot.size == 1) {
          navigation.navigate("Result", { key: data });
        } else {
          navigation.navigate("Add", { key: data, type: type });
        }
      });
  };

  if (hasPermission === null) {
    return (
      <View style={styles.Requesting_box}>
        <Text style={styles.Requesting}>Requesting for camera permission</Text>
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <View style={styles.Requesting_box}>
        <Text style={styles.Requesting}>No access to camera</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={styles.camera}
      >
        {/* <Text style={styles.description}>Scan your QR code</Text> */}
        <Image style={styles.qr} source={require("../assets/images/QR.png")} />
        {/* <Text onPress={() => setScanned(false)} style={styles.cancel}>
          Scan
        </Text> */}
      </BarCodeScanner>
      {/* {scanned && <TouchableOpacity
        onPress={() => setScanned(false)} 
      >
        <Text>Tap to Scan Again</Text>
      </TouchableOpacity>} */}
    </View>
  );
}

const styles = StyleSheet.create({
  Requesting_box: {
    flex: 1,
    alignContent: "center",
    justifyContent: "center",
  },
  Requesting: {
    fontSize: width * 0.045,
    textAlign: "center",
    fontWeight: "bold",
    color: "red",
  },

  camera: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
  },
  qr: {
    marginTop: "20%",
    marginBottom: "20%",
    width: qrSize,
    height: qrSize,
  },
  description: {
    fontSize: width * 0.09,
    textAlign: "center",
    width: "70%",
    color: "white",
  },
  cancel: {
    fontSize: width * 0.07,
    textAlign: "center",
    width: "30%",
    color: "white",
    backgroundColor: "green",
    padding: 2,
    borderRadius: 15,
  },
});
