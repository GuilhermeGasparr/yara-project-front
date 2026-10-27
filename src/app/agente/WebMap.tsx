import { Platform } from "react-native";
import WebMapNative from "./WebMap.native";
import WebMapWeb from "./WebMap.web";

export default Platform.OS === "web" ? WebMapWeb : WebMapNative;