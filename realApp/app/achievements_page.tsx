import React, { use, useEffect, useState } from "react";
import { StyleSheet, Touchable, TouchableOpacity } from "react-native";
import Reporter from "./Reporter"
import { useLocalSearchParams } from "expo-router";
import { View, ScrollView, YStack, XStack, Card, Image, Text, H6, Button, Paragraph, validPseudoKeys } from "tamagui";
import Modal from "react-native-modal";

type AchievementProps = {
  image_url?: string;
  description?: string;
  name?: string;
};

function Achievement({ image_url, description, name }: AchievementProps) {
  const desc = description ?? "???";
  const award_name = name ?? "???";
  const [isVisible, setVisible] = useState(false);

  return (
    <View>
      <TouchableOpacity onPress={() => setVisible(true)}>
        <Image
          src={image_url? image_url : "../assets/images/PlaceholderAward.png"}
          style={{ width: 100, height: 100, margin: 10}}
        />
      </TouchableOpacity>

      <Modal
        isVisible={isVisible}
        onBackButtonPress={() => setVisible(false)}
        onBackdropPress={() => setVisible(false)}
      >
        <View style={styles.centeredView}>
          <Card style={styles.modalView}>
            <Image
              src={image_url? image_url : "../assets/images/PlaceholderAward.png"}
              style={{ width: 120, height: 120, marginBottom: 15}}
            />
            <H6 textAlign="center" style={{marginBottom: 10}}>{award_name}</H6>
            <Paragraph textAlign="center">{desc}</Paragraph>
          </Card>
        </View>
      </Modal>
    </View>
  );
}


export default function AchievementsPage() {

  const awards = ["", "OnFire", "LoggingHard", "Scholar","TouchGrass", "BookWorm"]
  const award_info: { [key: string]: {url: string, name: string, description: string} } = {
    "": {url: require("../assets/images/PlaceholderAward.png"),
      name: "???",
      description: "???",
    },
    "OnFire": {
      url: require("../assets/images/OnFire.png"),
      name: "On Fire!",
      description: "You continued your streak for a week"
    },
    "LoggingHard": {
      url: require("../assets/images/LoggingHard.png"),
      name: "Logging Hard or Bear-ly Logging?",
      description: "You logged 15 times!"
    },
    "Scholar": {
      url: require("../assets/images/Scholar.png"),
      name: "The Scholar",
      description: "You logged 15 times with a motivation for \'Education\'"
    },
    "TouchGrass": {
      url: require("../assets/images/TouchGrass.png"),
      name: "Touch Grass",
      description: "You logged 15 times that you used your phone or some other electronic device"
    },
    "BookWorm": {
      url: require("../assets/images/PlaceholderAward.png"),
      name: "Book Worm",
      description: "You logged 15 times that you read a book or some other printed media"
    },
  }



  return (
    <ScrollView style={{ marginTop: 50, marginLeft: 20, marginRight: 20}}>
    <YStack>
        <XStack flexWrap="wrap" alignContent="center" justifyContent="center">
            {awards.map((v, index) => (
              <Achievement key={index} name={award_info[v].name} image_url={award_info[v].url} description={award_info[v].description}/>
            ))}
        </XStack>
    </YStack>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: 300,  
    margin: 20,
    borderRadius: 20,
    padding: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#949494ff',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  Input: {
    fontSize: 22,
    backgroundColor:"#bdbdbd28",
    width: 70, 
    height: 70,
    textAlign: 'center',
  },
    InputError: {
    color: "red",
    fontSize: 22,
    backgroundColor:"#bdbdbd28",
    width: 70, 
    height: 70,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 30,
    marginBottom: 15,
    textAlign: 'center',
  },
});