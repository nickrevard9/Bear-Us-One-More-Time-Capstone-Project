# Expo Go App
## Setting up the Application

1. Clone The Repository... by running the following commands: 

```bash
git clone https://github.com/nickrevard9/Bear-Us-One-More-Time-Capstone-Project.git
cd Bear-Us-One-More-Time-Capstone-Project/realapp/
```

2. Install dependencies using: 

```bash
npm install
```
3. To update the dependencies in the future:
```bash
npm update
```
4. Start the app using `npx expo start` or `npx expo start --tunnel -c` if on Baylor’s network as it bricks some packages
  
   In the output, you'll find options to open the app in a 
   - [development build](https://docs.expo.dev/develop/development-builds/introduction/)
   - [Android emulator](https://docs.expo.dev/develop/development-builds/introduction/)
   - [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
   - [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo 

   You can start developing by editing the files inside the app directory. This project uses file-based routing. 

### Learn More 
To learn more about developing your project with Expo, look at the following resources: 

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals or go into advanced topics with our guides. 
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web. 

## Frontend Expo SQLite Database Setup 

This is a way for us to store data onto the phone without utilizing a backend service for retrieving, inserting, and altering. As soon as the app is bundled onto the phone, the app will instantiate the database and its tables automatically. 

How it does that: 

1. In ``realapp/lib/`` there is a typescript file `db.ts`. 

   a. Interfaces are used to extract data in an object-oriented manner 

   b. The function `initDb()` will initialize the database and its tables. This is run on the `realapp/app/_layout.tsx` page via the `SQLiteProvider` component. 

   c. Async functions for interacting with the database will be written in this document. 

2. To utilize the SQL database in typescript pages: 

   a. The useSQLiteContext component must be imported from `expo-sqlite`.

   b. The necessary functions must be imported from `lib/db`

   c. The page must be in the `app/` directory 

Please note that MySQL is different from SQLite. More information on Expo SQLite is available here: [SQLite - Expo Documentation](https://docs.expo.dev/versions/latest/sdk/sqlite/).

 
### Expo SecureStore and AsyncStorage 

We utilize Expo’s SecureStore and React Native’s AsyncStorage to persist key-value pairs in the application. This is used to track session management in the application, along with other non-vital information that the app retains for visuals and performan 

More information can be found here: 
- [SecureStore - Expo Documentation](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [@react-native-async-storage/async-storage - Expo Documentation](https://docs.expo.dev/versions/latest/sdk/async-storage/)

#### Resetting the Database – TESTING PURPOSES ONLY 

There is a `settings.tsx` page in the `realapp/` that is not shown in the app. This page contains a “reset database” button that will drop all tables. The developer can then reload the app to retest the app. To reach this page, uncomment the “Settings” button on the `profile_page.tsx.`  

## Updating ExpoGo, TamaGUI, and React Native
Expo Upgrade (MacOS Support):  
https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/

When updating ExpoGo, TamaGUI and React Native versions must also be upgraded. It is REALLY IMPORTANT that you update these versions accordingly to avoid console.errors. 

### Updating ExpoGo 

When updating ExpoGo, try running these commands: 

Windows:
```bash 
npx expo upgrade
```
MacOS:
```bash
npm install expo@latest
npx expo install –fix
```

 

Then run the expo doctor to check for any issues: ``npx expo-doctor``

### Updating TamaGUI 

After updating ExpoGo, you will need to update TamaGUI to the newest version. Try running this command: 

```bash 
npm install @tamagui@latest
```

After running this command, make sure to update all other tamaGUI packages to match that version. For example, if tamaGUI latest version is ^1.135.0, all other packages should look like this in your package.json: 

 ```json
"@tamagui/alert-dialog": "^1.135.0", 
"@tamagui/babel-plugin": "^1.135.0", 
"@tamagui/config": "^1.135.0", 
"@tamagui/constants": "^1.135.0", 
"@tamagui/lucide-icons": "^1.135.0", 
"@tamagui/metro-plugin": "^1.135.0", 
"@tamagui/portal": "^1.135.0", 
 ```

### Update React Native and TypeScript accordingly 

You should receive some feedback from the terminal during all these installs and upgrades. If you see anything about a mismatch version, check your package.json and make the changes if needed. 

**NOTE** - Make sure you run ‘npm install’ after making manual changes! Otherwise, you won’t see those changes go into effect!! 

## Testing Options 

### Automated Unit Testing 

- Jest
   - Provides frontend and backend testing for JavaScript 
   - Can be arranged into testing suites of related subjects 
   - Lots of documentation available and plenty of online support 
   - https://jestjs.io/ 

### Real-time Consumer Testing 
- ExpoGo 
   - Used to deploy apps to your phone or emulator 
   - We can do hands-on testing this way  
   - Can be used to get user/client feedback 
   - https://expo.dev/go 

## Screentime Data 

### iOS Data 
To get media use data from iOS devices, we will use the [Apple Developer Screen Time API](https://developer.apple.com/videos/play/wwdc2021/10123/). The API provides two general modules: 
- [DeviceActivity](https://developer.apple.com/documentation/DeviceActivity)
- [FamilyControls](https://developer.apple.com/documentation/FamilyControls)

Since this is the only known method to get screen time data from an iPhone, we are restricted to use of this API. This means the following: 

- We must develop the iOS device data gathering submodules in Swift 
- We can only support iOS devices with iOS 15.0+ or iPadOS 15.0+ 
- Exporting said data to a CSV is restricted by Apple, so we will need a way for the user to willingly interact with the data, then export it themselves.  

This requires an AppleDeveloper account with entitlements to access the “Family Controls” capabilities 

### Android Data 

To get Android app data you must first get the user to give permission to [UsageStatsManager](https://developer.android.com/reference/android/app/usage/UsageStatsManager). The user must be prompted to give this access. 

React Native does not have an API to access this data. So, we will have to create a native module in Java/Kotlin to get the data needed from the device. This will be bundled with the project itself. 

## Developer Build 

The Expo development build is used to use libraries with native code that aren’t in Expo Go. This allows the application to use features not included in Expo Go and allows developers to test features that behave differently in a production-like native environment. For all builds that run on an iPhone, a paid Apple Developer account is required for build signing. 

### Learn More 
- [Expo Development Build](https://docs.expo.dev/develop/development-builds/introduction)
- [How to Create a Dev Build](https://docs.expo.dev/develop/development-builds/create-a-build)