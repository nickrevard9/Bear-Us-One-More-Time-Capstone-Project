import React, { use, useCallback, useEffect, useState } from "react";
import { ImageRequireSource, ImageSourcePropType, StyleSheet, Touchable, TouchableOpacity } from "react-native";
import Reporter from "./Reporter"
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import {Achievement, getAchievementsByUser, getTotalAchievements } from '../lib/db';
import { View, ScrollView, YStack, XStack, Card, Image, Text, H6, Button, Paragraph, validPseudoKeys } from "tamagui";
import Modal from "react-native-modal";
import {useSQLiteContext} from "expo-sqlite";
import { image_requires } from "@/assets/images/achievement_images"


/**
 * Achievement Toggle Component
 * @param image_url - URL of the achievement image
 * @param description - Description of the achievement
 * @param name - Name of the achievement
 * @return Achievement Toggle Component - shows achievement image and modal on click
 */
type AchievementProps = {
  image_url?: string;
  description?: string;
  name?: string;
};

function Achievement_Toggle({ image_url, description, name }: AchievementProps) {
  const desc = description ?? "???";
  const award_name = name ?? "???";
  const [isVisible, setVisible] = useState(false);

  return (
    <View>
      <TouchableOpacity onPress={() => setVisible(true)}>
        <Image
          source={image_url? {uri: image_url}: {uri: image_requires[""]}}
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
              source={image_url? {uri: image_url}: {uri: image_requires[""]}}
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
  // State variables holding the achievements the user has earned
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [totalAchievements, setTotalAchievements] = useState(0);
  const db = useSQLiteContext(); // SQLite context for database access

  // Fetch achievements when the page is focused (done once via useFocusEffect to avoid multiple fetches))
  useFocusEffect(
    useCallback(() => {
      retrieveAchievements();
    },[])
  )

  /**
   * Retrieve Achievements from Database
   * Fetches the achievements earned by the user and the total number of achievements available
   */
  async function retrieveAchievements() {
    setAchievements(await getAchievementsByUser(db));
    setTotalAchievements(await getTotalAchievements(db));
  }

  /**
   * Print Remainder
   * @returns Achievement Toggle components for unearned achievements
   */
  function printRemainder() {
    const elements =[];
    for(let i = achievements.length; i < totalAchievements; i++){
      elements.push(<Achievement_Toggle key={i}/>)
    }
    return elements;
  }
  

  return (
    <ScrollView style={{ marginTop: 50, marginLeft: 20, marginRight: 20}}>
    <YStack>
        <XStack flexWrap="wrap" alignContent="center" justifyContent="center" >
            {achievements.map((v, index) => (
              <Achievement_Toggle 
              key={v.name} 
              name={v.name} 
              image_url={image_requires[v.achievement_id]? 
                image_requires[v.achievement_id] : image_requires[""] } 
              description={v.description}/>
            ))}
            {printRemainder()}
        </XStack>
    </YStack>
    </ScrollView>
  );
}

// For the Achievement Toggle Modal styles
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
});