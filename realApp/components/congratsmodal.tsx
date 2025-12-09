import React, {use, useEffect, useState } from  'react';
import {StyleSheet, Alert } from "react-native";
import Modal from "react-native-modal";
import { View, Button, Card, Text, Image, YStack, H6, H5, H2 } from "tamagui";
import { Achievement } from "../lib/db"
import { image_requires } from '@/assets/images/achievement_images';

/**
 * Props for CongratsModal component
 * @property {Achievement[]} achievements - List of achievements earned
 * @property {boolean} streak_increased - Whether the user's streak has increased
 * @property {number} [streak] - The new streak value, if applicable
 * @property {boolean} isVisible - Whether the modal is visible
 * @property {() => void} onConfirm - Callback function when the modal is confirmed/closed
 */
type CongratsModalProps = {
    achievements: Achievement[]
    streak_increased: boolean;
    streak?: number;
    isVisible: boolean;
    onConfirm: () => void;
};

/**
 * CongratsModal
 * 
 * A modal component that displays achievements earned and streak increases.
 * @param {CongratsModalProps} props - Props for the CongratsModal component 
 * @returns 
 */
export function CongratsModal({achievements, streak_increased, streak, isVisible, onConfirm}:CongratsModalProps) {
    const [index, setIndex] = useState<number>(0)
    function onNext(): void {
        if(index + 1 == achievements.length + Number(streak_increased)){
            onConfirm();
        }
        else{
            setIndex(index+1)
        }
    }
    
    /**
     * renderCards
     * 
     * Renders the achievement and streak cards for the modal.
     * @returns The array of card elements to be displayed in the modal.
     */
    function renderCards() {
        const elements = [];

        achievements.forEach((v,i) => 
            elements.push(
                <Card key={i}>
                    <YStack style={styles.modalView}>
                        <H6 style={styles.modalText}>You got the achievement</H6>
                        <H5 style={styles.modalText}>{v.name}</H5>
                        <Image
                            source={image_requires[v.achievement_id]? {uri: image_requires[v.achievement_id]}: {uri: image_requires[""]}}
                            style={{ width: 120, height: 120, marginBottom: 15}}
                        />
                        <Text style={styles.modalText}>{v.description}</Text>
                        <Button onPress={onNext} variant='outlined'>Next</Button>
                    </YStack>
                </Card>
            )
        );

        if(streak_increased){
            // push card with streak
            elements.push(
                <Card key={achievements.length}>
                    <YStack style={styles.modalView}>
                    <H5 style={styles.modalText}>You increased your streak to </H5>
                    <H2 style={styles.modalText}>{streak}</H2>
                        <Button onPress={onNext} variant='outlined'>Next</Button>
                    </YStack>
                </Card>
            )
        }
        return elements;
    }

    const e = renderCards(); // Make the cards

    // Render the modal with the current card
    return(
        <View style={{flex: 2}}>
          <Modal
          coverScreen
          isVisible={isVisible} 
          onBackButtonPress={onConfirm}
          onBackdropPress={onConfirm}>
                <View style={styles.centeredView}>
                  {e[index]}
                </View>
            </Modal>
        </View>
    );
}

// Styles for the CongratsModal component
const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
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
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
});