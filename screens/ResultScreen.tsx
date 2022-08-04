import {
  StyleSheet,
  Image,
  ScrollView,
  RefreshControl,
  TouchableHighlight,
  Alert,
  Dimensions,
} from "react-native";
import { useEffect, useState } from "react";

import { Text, View } from "../components/Themed";
import firestore from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";

import { Table, TableWrapper, Rows, Col } from "react-native-table-component";

import { useRoute } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");

export default function ResultScreen({ navigation }) {
  const [getResult, setResult] = useState({});
  const [geturl, seturl] = useState("");
  const [image_url_true, checkimageurl] = useState(false);
  const [refreshing, setRefreshing] = useState(true);
  const [imageload, Setimageload] = useState(true);
  const [upload_active, Setupload_active] = useState(false);

  const geturllink = async (path) => {
    await storage()
      .ref(path)
      .getDownloadURL()
      .then((url) => {
        seturl(url);
        checkimageurl(true);
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
          setResult(data);
          console.log(data);
        });
      });
    setRefreshing(false);
  };
  const route = useRoute();
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      // The screen is focused
      // Call any action and update data
      getRestaurants(route.params.key);
    });

    // Return the function to unsubscribe from the event so it gets removed on unmount

    //return unsubscribe;
  }, [navigation]);

  const state = {
    tableTitle: ["Name", "Price", "Key", "Key Type"],
    tableData: [
      [getResult.name],
      [getResult.price],
      [getResult.key],
      [getResult.keytype],
    ],
  };

  const onRefresh = () => {
    setRefreshing(true);
    getRestaurants(route.params.key);
  };

  const comfirmAlert = () => {
    Alert.alert(
      "Delete Product",
      `Delete this Product name : ${getResult.name} ?`,
      [
        {
          text: "Yes",
          onPress: async () => {
            Setupload_active(true);
            if (!getResult.imagePath.includes("noimage.png")) {
              await storage()
                .ref(getResult.imagePath)
                .delete()
                .then(function () {
                  // File deleted successfully
                  console.log(" File deleted successfully");
                })
                .catch(function (error) {
                  console.log(" Uh-oh, an error occurred! : ", error);
                });
            }

            await firestore()
              .collection("Products")
              .doc(getResult.id)
              .delete()
              .then(() => {
                navigation.navigate("TabOne");
              });
          },
        },
        {
          text: "No",
          onPress: undefined,
          style: "cancel",
        },
      ]
    );
  };

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      style={styles.container}
    >
      <View style={{ flex: 1, alignItems: "center" }}>
        {image_url_true && (
          <Image
            source={{
              uri: geturl,
            }}
            style={{
              width: 350,
              height: 175,
              marginBottom: 5,
            }}
            onLoadStart={() => {
              console.log("load");
              Setimageload(true);
            }}
            onLoadEnd={() => {
              console.log("loadEND");
              Setimageload(false);
            }}
          />
        )}

        {imageload && image_url_true && (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              position: "absolute",
              alignContent: "center",
              width: "100%",
              height: "100%",
            }}
          >
            <Image
              source={require("../assets/gif/loading2.gif")}
              style={{
                width: 128,
                height: 128,
                marginBottom: 5,
              }}
            />
            <Text style={styles.aboutTitle}>Loading...</Text>
          </View>
        )}
      </View>
      <Table borderStyle={{ borderWidth: 2 }}>
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
            textStyle={[styles.text, { color: "green" }]}
          />
        </TableWrapper>
      </Table>
      <Text style={styles.aboutTitle}>About :</Text>
      <Text style={styles.aboutBody}>{getResult.about}</Text>
      <View
        style={styles.separator}
        lightColor="#eee"
        darkColor="rgba(255,255,255,0.1)"
      />
      {!imageload && (
        <View style={{ backgroundColor: "transparent" }}>
          <TouchableHighlight
            onPress={() => {
              navigation.navigate("Edit", {
                key: route.params.key,
              });
            }}
            style={styles.image_btn}
          >
            <Text style={styles.image_btn_text}>Edit</Text>
          </TouchableHighlight>

          <TouchableHighlight
            onPress={() => {
              comfirmAlert();
            }}
            style={styles.image_btn}
          >
            <Text style={styles.image_btn_text}>Delete</Text>
          </TouchableHighlight>
        </View>
      )}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 30 },
  wrapper: {
    flexDirection: "row",
    backgroundColor: "#f6f8fa",
    color: "green",
  },
  title: { backgroundColor: "#f6f8fa", fontWeight: "bold" },
  row: { height: 28 },
  text: {
    textAlign: "center",
    color: "green",
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
  image_btn: {
    marginTop: 20,
    backgroundColor: "red",
    marginHorizontal: 20,
    padding: 7,
    borderRadius: 10,
  },
  image_btn_text: {
    color: "white",
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
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
