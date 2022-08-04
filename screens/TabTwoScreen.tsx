import { StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { useState, useEffect } from "react";
import { Text, View } from "../components/Themed";
import firestore from "@react-native-firebase/firestore";

export default function TabTwoScreen({ navigation }) {
  const [selectedId, setSelectedId] = useState(null);
  const [readylist, Setreadylist] = useState(true);
  const [refreshing, setRefreshing] = useState(true);

  const [data, Setdata] = useState([]);

  const getRestaurants = async () => {
    let DATA = [];
    await firestore()
      .collection("Products")
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((snapshot) => {
          DATA.push({
            id: snapshot.id,
            ...snapshot.data(),
          });
        });
      });
    console.log(DATA);
    Setdata(DATA);
    //Setreadylist(true);
    setRefreshing(false);
  };
  useEffect(() => {
    setRefreshing(true);
    getRestaurants();
  }, [navigation]);

  const onRefresh = () => {
    getRestaurants();
    setRefreshing(false);
  };

  const Item = ({ item, onPress, backgroundColor, textColor }) => (
    <TouchableOpacity onPress={onPress} style={[styles.item, backgroundColor]}>
      <Text style={[styles.title, textColor]}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }) => {
    const backgroundColor = item.id === selectedId ? "#6e3b6e" : "#f9c2ff";
    const color = item.id === selectedId ? "white" : "black";

    return (
      <Item
        item={item}
        onPress={() => {
          navigation.navigate("Result", { key: item.key });
        }}
        backgroundColor={{ backgroundColor }}
        textColor={{ color }}
      />
    );
  };
  return (
    <View style={styles.container}>
      {readylist && (
        <FlatList
          data={data}
          style={styles.FlatList}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
  FlatList: {
    flex: 1,
    width: "100%",
  },
  item: {
    marginTop: 10,
    flex: 1,
    marginHorizontal: 10,

    padding: 20,
    marginVertical: 2,
    borderRadius: 15,
  },
  title: {
    fontSize: 32,
  },
});
