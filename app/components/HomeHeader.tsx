"use client";

import { View, Text, TouchableOpacity, Image } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import CustomText from "./CustomText";

interface HeaderProps {
  onMenuPress: () => void;
  username?: string;
  avatar?: string;
}

const HomeHeader: React.FC<HeaderProps> = ({
  onMenuPress,
  username = "",
  avatar = "",
}) => {
  return (
    <View className="w-full h-20 px-4 flex-row items-center justify-between bg-[#3F401B]">
      <View className="flex-row items-center">
        <TouchableOpacity onPress={onMenuPress} className="mr-4">
          <MaterialCommunityIcons name="menu" size={26} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity className="w-10 h-10 rounded-full overflow-hidden bg-[#FF4D00] mr-3">
          <Image
            source={{ uri: avatar }}
            className="w-full h-full"
            resizeMode="cover"
          />
        </TouchableOpacity>

        <View>
          <CustomText secondary size="sm" className="-mb-[0.2px]">
            Hi,
          </CustomText>
          <CustomText size="sm" >
            {username}
          </CustomText>
        </View>
      </View>

      <TouchableOpacity className="relative">
        <MaterialCommunityIcons name="bell-outline" size={26} color="#FFFFFF" />

        {/* <View className="absolute -top-1 -right-1 bg-red-600 w-4 h-4 rounded-full justify-center items-center">
          <Text className="text-white text-[10px] font-rubik-bold">2</Text>
        </View> */}
      </TouchableOpacity>
    </View>
  );
};

export default HomeHeader;
