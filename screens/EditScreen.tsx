import { StatusBar } from "expo-status-bar";
import {
  Platform,
  StyleSheet,
  Image,
  Button,
  ScrollView,
  RefreshControl,
  TextInput,
  TouchableHighlight,
  KeyboardAvoidingView,
  LogBox,
  ActivityIndicator,
  Dimensions,
  Alert,
} from "react-native";
import { useEffect, useState } from "react";

import { Text, View } from "../components/Themed";
import firestore from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";
import * as ImagePicker from "expo-image-picker";
import { useRoute } from "@react-navigation/native";

import {
  Table,
  TableWrapper,
  Row,
  Rows,
  Col,
} from "react-native-table-component";

const { width, height } = Dimensions.get("window");
const qrSize = width * 0.7;

export default function EditScreen({ navigation }) {
  const route = useRoute();
  const [imageUri, SetImageUri] = useState(false);
  const [ProductName, SetProductName] = useState("");
  const [ProductPrice, SetProductPrice] = useState(null);
  const [ProductAbout, SetProductAbout] = useState(null);
  const [upload_active, Setupload_active] = useState(false);
  const [getResult, setResult] = useState({});
  const [refreshing, setRefreshing] = useState(true);

  const geturllink = async (path) => {
    await storage()
      .ref(path)
      .getDownloadURL()
      .then((url) => {
        SetImageUri(url);
        //checkimageurl(true);
      });
  };
  const getRestaurants = async (key) => {
    let data;
    await firestore()
      .collection("Products")
      .where("key", "==", key)
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((snapshot) => {
          geturllink(snapshot.data().imagePath);
          data = {
            id: snapshot.id,
            ...snapshot.data(),
          };
          console.log(data);
          setResult(data);
          SetProductName(data.name);
          SetProductPrice(data.price);
          SetProductAbout(data.about);
        });
      });

    setRefreshing(false);
  };

  const onRefresh = () => {
    console.log("refreshing");
    setRefreshing(true);
    getRestaurants(route.params.key);
  };
  const state = {
    tableTitle: ["Key", "Key Type"],
    tableData: [[getResult.key], [getResult.keytype]],
  };

  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          alert("Sorry, we need camera roll permissions to make this work!");
        }
      }
    })();
    getRestaurants(route.params.key);
  }, []);

  const saveData = async () => {
    Setupload_active(true);
    navigation.setOptions({
      headerBackVisible: false,
    });
    // navigation.option.headerBackVisible = false;
    let fileName = "noimage.png";
    let newdata;
    newdata = {
      name: ProductName,
      key: getResult.key,
      keytype: getResult.keytype,
      price: ProductPrice,
      about: ProductAbout,
    };
    if (imageUri) {
      fileName = imageUri.split("/").pop();
      if (!imageUri.includes("https://firebasestorage.googleapis.com")) {
        await storage()
          .ref(getResult.imagePath)
          .putFile(imageUri)
          .then(() => {
            //console.log("image added!");
          });
        newdata = {
          name: ProductName,
          key: getResult.key,
          keytype: getResult.keytype,
          price: ProductPrice,
          about: ProductAbout,
          imagePath: getResult.imagePath,
        };
      }
    }
    await firestore()
      .collection("Products")
      .doc(getResult.id)
      .update(newdata)
      .then(() => {
        //console.log("User added!");
        navigation.navigate("TabOne");
      });
  };

  const openCamera = async () => {
    // Ask the user for the permission to access the camera
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("You've refused to allow this appp to access your camera!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.cancelled) {
      //console.log(result.uri);
      SetImageUri(result.uri);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.cancelled) {
      //console.log(result.uri);
      SetImageUri(result.uri);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        styles={styles.scroll}
      >
        <View style={styles.image_box}>
          {imageUri && (
            <Image
              source={{
                uri: imageUri,
              }}
              style={{
                width: 350,
                height: 175,
                marginBottom: 5,
              }}
            />
          )}
          {!imageUri && (
            <Image
              source={require("../assets/images/UploadImage.png")}
              style={{
                width: 128,
                height: 128,
                marginBottom: 5,
              }}
            />
          )}

          <View style={styles.image_control_box}>
            <TouchableHighlight onPress={pickImage} style={styles.image_btn}>
              <Text style={styles.image_btn_text}>Select image</Text>
            </TouchableHighlight>
            <TouchableHighlight onPress={openCamera} style={styles.image_btn}>
              <Text style={styles.image_btn_text}>Open camera</Text>
            </TouchableHighlight>
          </View>
        </View>
        <View style={styles.tableBox}>
          <Table borderStyle={styles.table}>
            <TableWrapper style={styles.wrapper}>
              <Col
                data={state.tableTitle}
                style={styles.title}
                heightArr={[28, 28]}
                textStyle={styles.text}
              />
              <Rows
                data={state.tableData}
                flexArr={[2]}
                style={styles.row}
                textStyle={[styles.text, { color: "blue" }]}
              />
            </TableWrapper>
          </Table>
        </View>
        <TextInput
          style={styles.input}
          onChangeText={SetProductName}
          value={ProductName}
          placeholder="Product Name"
        />
        <TextInput
          style={styles.input}
          onChangeText={(number) => SetProductPrice(number)}
          value={ProductPrice}
          placeholder="Product Price Ex:10$"
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          onChangeText={(text) => SetProductAbout(text)}
          value={ProductAbout}
          placeholder="Write About this Product"
        />

        {!upload_active && (
          <TouchableHighlight onPress={saveData} style={styles.image_btn}>
            <Text style={styles.image_btn_text}>Save</Text>
          </TouchableHighlight>
        )}
      </ScrollView>
      {upload_active && (
        <View style={styles.Indicator_box}>
          <Image
            source={require("../assets/gif/loading1.gif")}
            style={{
              height: 180,
              width: 180,
              marginBottom: 5,
            }}
          />
          <Text style={{ color: "black", fontSize: 30, fontWeight: "bold" }}>
            Loading...
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    justifyContent: "center",
    alignItems: "center",
  },

  input: {
    height: 40,
    marginBottom: 5,
    marginTop: 5,
    width: "100%",
    borderWidth: 1,
    padding: 10,
  },
  image_box: {
    backgroundColor: "#deddd9",
    alignItems: "center",
    padding: 10,
    borderColor: "#deddd9",
    borderRadius: 15,
    marginBottom: 10,
  },
  image_control_box: {
    flexDirection: "row",
    backgroundColor: "transparent",
    padding: 5,
  },
  image_btn: {
    backgroundColor: "white",
    marginHorizontal: 20,
    padding: 7,
    borderRadius: 10,
  },
  image_btn_text: {
    color: "green",
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
  },

  wrapper: {
    flexDirection: "row",
    backgroundColor: "#f6f8fa",
    color: "green",
  },
  tableBox: {
    marginBottom: 10,
  },
  table: {
    borderWidth: 2,
  },
  title: { backgroundColor: "#f6f8fa", fontWeight: "bold" },
  row: { height: 28 },
  text: {
    textAlign: "center",
    color: "black",
    fontWeight: "bold",
    fontSize: 18,
  },
  aboutTitle: {
    color: "red",
    fontSize: 20,
    borderBottomColor: "gray",
    borderBottomWidth: 3,
    marginTop: 20,
    fontWeight: "bold",
  },
  aboutBody: {
    marginTop: 5,
  },
  Indicator: { flex: 1 },
  Indicator_box: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    backgroundColor: "transparent",
    opacity: 1, //0 to 1
    width: width,
    height: height,
  },
});
