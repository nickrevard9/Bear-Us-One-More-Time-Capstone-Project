import React, { useState } from 'react';
import { View, Button, XStack } from 'tamagui';
import { useLocalSearchParams } from 'expo-router';

import Reporter from '../Reporter';
import ReporterMadlib from '../MadLibReporter';

const ReportPage = () => {
  const { log_id } = useLocalSearchParams<{ log_id?: string }>();

  // true = Mad Lib style, false = original Report style
  const [useMadlib, setUseMadlib] = useState(true);

  const parsedLogId = log_id ? Number(log_id) : undefined;

  return (
    <View flex={1}>
      {/* Style toggle */}
      <XStack
        justifyContent="center"
        padding="$3"
        gap="$2"
      >
        <Button
          size="$2"
          onPress={() => setUseMadlib(true)}
          // filled when active, outlined when inactive
          variant={!useMadlib ? undefined : 'outlined'}
        >
          Mad Lib
        </Button>

        <Button
          size="$2"
          onPress={() => setUseMadlib(false)}
          variant={useMadlib ? undefined : 'outlined'}
        >
          Classic
        </Button>
      </XStack>

      {/* Content */}
      {useMadlib ? (
        <ReporterMadlib log_id={parsedLogId} />
      ) : (
        <Reporter log_id={parsedLogId} />
      )}
    </View>
  );
};

export default ReportPage;
