import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { ColorValue } from "react-native";
import React from "react";

import icons, { svgIcons } from "../assets/icons/icons";
import { SERVICE_ICONS } from "../components/home/Services/service-icons";
import { ServiceItem } from "../components/home/Services/types";
import { Transaction } from "./types/transaction";
import { DropdownOption } from "../components/inputs/DropdownInputs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';


const DEVICE_ID_KEY = "deviceId";
const DEVICE_ID_BACKUP_KEY = "deviceIdBackup";

const frequencyOptions = [
  { value: "once", label: "Once" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const dayOptions = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

const providers = [
  { id: "mtn", label: "MTN", icon: icons.mtn },
  { id: "airtel", label: "Airtel", icon: icons.airtel },
  { id: "glo", label: "Glo", icon: icons.glo },
  { id: "9mobile", label: "9mobile", icon: icons.ninemobile },
];

const billPaymentServices: ServiceItem[] = [
  { id: "1", icon: SERVICE_ICONS.airtime, label: "Airtime" },
  { id: "2", icon: SERVICE_ICONS.utility, label: "Utility" },
  { id: "3", icon: SERVICE_ICONS.data, label: "Data" },
  { id: "4", icon: SERVICE_ICONS.betting, label: "Betting" },
  { id: "5", icon: SERVICE_ICONS.tv, label: "Cable TV" },
  { id: "6", icon: SERVICE_ICONS.travel, label: "Travel" },
  { id: "7", icon: SERVICE_ICONS.internet, label: "Internet" },
  { id: "8", icon: SERVICE_ICONS.other, label: "Other bills" },
];

const otherServices: ServiceItem[] = [
  { id: "9", icon: SERVICE_ICONS.requestLoan, label: "Request loan" },
  { id: "10", icon: SERVICE_ICONS.insurance, label: "Buy Insurance" },
  { id: "11", icon: SERVICE_ICONS.schedule, label: "Schedule transaction" },
];

const   wealthManagement: ServiceItem[] = [
  { id: "12", icon: SERVICE_ICONS.basicSavings, label: "Basic savings" },
  { id: "13", icon: SERVICE_ICONS.targetSavings, label: "Target savings" },
  { id: "14", icon: SERVICE_ICONS.groupSavings, label: "Group savings" },
  { id: "15", icon: SERVICE_ICONS.fixedDeposit, label: "Fixed deposit" },
  { id: "16", icon: SERVICE_ICONS.shares, label: "Buy shares" },
  { id: "17", icon: SERVICE_ICONS.gold, label: "Gold" },
];

const utilityserviceItems = [
  {
    value: "ikeja_electric",
    label: "Ikeja electric",
    icon: () => <MaterialCommunityIcons name="flash" size={24} color="white" />,
  },
  {
    value: "eko_electric",
    label: "Eko electric",
    icon: () => <Ionicons name="flash" size={24} color="white" />,
  },
  {
    value: "abuja_electric",
    label: "Abuja electric",
    icon: () => <FontAwesome5 name="bolt" size={24} color="white" />,
  },
  {
    value: "kano_electric",
    label: "Kano electric",
    icon: () => <MaterialCommunityIcons name="flash" size={24} color="white" />,
  },
  {
    value: "port_harcourt_electric",
    label: "Port Harcourt electric",
    icon: () => <Ionicons name="flash" size={24} color="white" />,
  },
  {
    value: "ibadan_electric",
    label: "Ibadan electric",
    icon: () => <FontAwesome5 name="bolt" size={24} color="white" />,
  },
  {
    value: "jos_electric",
    label: "Jos electric",
    icon: () => <MaterialCommunityIcons name="flash" size={24} color="white" />,
  },
  {
    value: "kaduna_electric",
    label: "Kaduna electric",
    icon: () => <Ionicons name="flash" size={24} color="white" />,
  },
];

const utilityproductOptions = [
  { value: "prepaid", label: "Prepaid" },
  { value: "postpaid", label: "Postpaid" },
];

const internetServiceItems = [
  {
    value: "spectranet",
    label: "Spectranet",
    icon: () => <Ionicons name="globe-outline" size={24} color="white" />,
  },
  {
    value: "smile",
    label: "Smile",
    icon: () => <MaterialCommunityIcons name="wifi" size={24} color="white" />,
  },
  {
    value: "ntel",
    label: "NTEL",
    icon: () => <FontAwesome5 name="network-wired" size={24} color="white" />,
  },
];

const internetproductOptions = [
  { value: "domore_20gb", label: "DoMore 20GB", price: "7500" },
  { value: "basic_5gb", label: "Basic 5GB", price: "2500" },
  { value: "premium_50gb", label: "Premium 50GB", price: "15000" },
];

const travelServiceItems = [
  {
    value: "air_peace",
    label: "Air Peace",
    icon: () => <Ionicons name="airplane" size={24} color="white" />,
  },
];

const travelProductOptions = [
  { value: "domestic", label: "Domestic" },
  { value: "international", label: "International" },
];

const cableServiceItems = [
  {
    value: "dstv",
    label: "DSTV Subscription",
    icon: () => <Ionicons name="tv-outline" size={24} color="white" />,
  },
];

const cableProductOptions = [
  { value: "compact_plus", label: "Compact Plus", price: "200" },
  { value: "premium", label: "Premium", price: "500" },
  { value: "compact", label: "Compact", price: "150" },
];

const eventServiceTypes = [{ value: "event_tickets", label: "Event tickets" }];

const eventServiceItems = [
  {
    value: "africkets",
    label: "Africkets",
    icon: () => <Ionicons name="ticket-outline" size={24} color="white" />,
  },
];

const eventProductOptions = [
  { value: "africkets_orders", label: "Africkets Orders" },
];

const bettingServiceItems = [
  {
    value: "sportybet",
    label: "Sportybet",
    icon: () => <Ionicons name="football-outline" size={24} color="white" />,
  },
];

const bettingProductOptions = [{ value: "fund_wallet", label: "Fund wallet" }];

const mockTransactions: Transaction[] = [
  {
    id: "1",
    type: "received",
    name: "John Doe",
    number: "8344863939",
    amount: 10000,
    date: "2025-11-29T12:00:00",
    status: "successful",
    remark: "Personal transfer",
  },
  {
    id: "2",
    type: "airtime",
    name: "MTN",
    number: "08123456789",
    amount: -10000,
    date: "2025-11-29T09:00:00",
    status: "successful",
  },
  {
    id: "3",
    type: "received",
    name: "John Doe",
    number: "8344863939",
    amount: 10000,
    date: "2025-11-28T15:30:00",
    status: "successful",
    remark: "Refund",
  },
  {
    id: "4",
    type: "airtime",
    name: "MTN",
    number: "08123456789",
    amount: -10000,
    date: "2025-11-28T11:00:00",
    status: "successful",
  },
];

type GradientColors = readonly [ColorValue, ColorValue, ...ColorValue[]];
type TwoColorGradient = readonly [ColorValue, ColorValue];

interface ColorOption {
  value: string;
  label: string;
  gradient: TwoColorGradient;
}

const colorOptions: ColorOption[] = [
  { value: "gold", label: "Gold", gradient: ["#1A1A1A", "#88894B"] },
  { value: "white", label: "White", gradient: ["#BABABA", "#FFFFFF"] },
  { value: "black", label: "Black", gradient: ["#181818", "#434343"] },
];

const colorGradients: Record<string, GradientColors> = {
  gold: ["#1A1A1A", "#88894B"],
  white: ["#BABABA", "#FFFFFF"],
  black: ["#434343", "#181818"],
};

const getCurrencySymbol = (currency: string): string => {
  switch (currency.toUpperCase()) {
    case "NGN":
      return "₦";
    case "USD":
      return "$";
    case "GBP":
      return "£";
    default:
      return "";
  }
};

const getBrandLogo = (
  brandValue: string,
  size: number = 24,
  color?: ColorValue
): React.ReactNode => {
  const brandMap: Record<string, React.ComponentType<any>> = {
    mastercard: svgIcons.master_card,
    visa: svgIcons.visa,
    verve: svgIcons.verve,
  };

  const BrandIcon = brandMap[brandValue.toLowerCase()];

  if (!BrandIcon) {
    return null;
  }

  return <BrandIcon width={size} height={size} fill={color} />;
};
const genderOptions: DropdownOption[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

const stateOptions: DropdownOption[] = [
  { value: "abia", label: "Abia" },
  { value: "adamawa", label: "Adamawa" },
  { value: "akwa ibom", label: "Akwa Ibom" },
  { value: "anambra", label: "Anambra" },
  { value: "bauchi", label: "Bauchi" },
  { value: "bayelsa", label: "Bayelsa" },
  { value: "benue", label: "Benue" },
  { value: "borno", label: "Borno" },
  { value: "cross river", label: "Cross River" },
  { value: "delta", label: "Delta" },
  { value: "ebonyi", label: "Ebonyi" },
  { value: "edo", label: "Edo" },
  { value: "ekiti", label: "Ekiti" },
  { value: "enugu", label: "Enugu" },
  { value: "fct", label: "FCT" },
  { value: "gombe", label: "Gombe" },
  { value: "imo", label: "Imo" },
  { value: "jigawa", label: "Jigawa" },
  { value: "kaduna", label: "Kaduna" },
  { value: "kano", label: "Kano" },
  { value: "katsina", label: "Katsina" },
  { value: "kebbi", label: "Kebbi" },
  { value: "kogi", label: "Kogi" },
  { value: "kwara", label: "Kwara" },
  { value: "lagos", label: "Lagos" },
  { value: "nasarawa", label: "Nasarawa" },
  { value: "niger", label: "Niger" },
  { value: "ogun", label: "Ogun" },
  { value: "ondo", label: "Ondo" },
  { value: "osun", label: "Osun" },
  { value: "oyo", label: "Oyo" },
  { value: "plateau", label: "Plateau" },
  { value: "rivers", label: "Rivers" },
  { value: "sokoto", label: "Sokoto" },
  { value: "taraba", label: "Taraba" },
  { value: "yobe", label: "Yobe" },
  { value: "zamfara", label: "Zamfara" },
];

const cityOptions: DropdownOption[] = [
  { value: "lagos", label: "Lagos" },
  { value: "abuja", label: "Abuja" },
  { value: "port harcourt", label: "Port Harcourt" },
  { value: "kano", label: "Kano" },
  { value: "ibadan", label: "Ibadan" },
  { value: "kaduna", label: "Kaduna" },
  { value: "benin city", label: "Benin City" },
  { value: "enugu", label: "Enugu" },
  { value: "maiduguri", label: "Maiduguri" },
  { value: "jos", label: "Jos" },
  { value: "ilorin", label: "Ilorin" },
  { value: "akure", label: "Akure" },
  { value: "ado ekiti", label: "Ado Ekiti" },
  { value: "abeokuta", label: "Abeokuta" },
  { value: "uyo", label: "Uyo" },
  { value: "calabar", label: "Calabar" },
  { value: "warri", label: "Warri" },
  { value: "asaba", label: "Asaba" },
  { value: "onitsha", label: "Onitsha" },
  { value: "owerri", label: "Owerri" },
  { value: "aba", label: "Aba" },
  { value: "umunede", label: "Umunede" },
  { value: "gombe", label: "Gombe" },
  { value: "damaturu", label: "Damaturu" },
  { value: "jalingo", label: "Jalingo" },
  { value: "bauchi", label: "Bauchi" },
  { value: "sokoto", label: "Sokoto" },
  { value: "birnin kebbi", label: "Birnin Kebbi" },
  { value: "gusau", label: "Gusau" },
  { value: "lokoja", label: "Lokoja" },
  { value: "minna", label: "Minna" },
  { value: "lafia", label: "Lafia" },
  { value: "yola", label: "Yola" },
  // Add more cities as needed
];

// Full list of Nigerian states and their LGAs (corrected for uniqueness and accuracy)
const nigeriaStates: { [key: string]: string[] } = {
  abia: [
    "Aba North",
    "Aba South",
    "Arochukwu",
    "Bende",
    "Ikwuano",
    "Isiala-Ngwa North",
    "Isiala-Ngwa South",
    "Isuikwato",
    "Obi Ngwa",
    "Ohafia",
    "Osisioma Ngwa",
    "Ugwunagbo",
    "Ukwa East",
    "Ukwa West",
    "Umuahia North",
    "Umuahia South",
    "Umu Nneochi",
  ],
  adamawa: [
    "Demsa",
    "Fufore",
    "Ganye",
    "Girei",
    "Gombi",
    "Guyuk",
    "Hong",
    "Jada",
    "Lamurde",
    "Madagali",
    "Maiha",
    "Mayo-Belwa",
    "Michika",
    "Mubi North",
    "Mubi South",
    "Numan",
    "Shelleng",
    "Song",
    "Toungo",
    "Yola North",
    "Yola South",
  ],
  "akwa ibom": [
    "Abak",
    "Eastern Obolo",
    "Eket",
    "Esit Eket",
    "Essien Udim",
    "Etim Ekpo",
    "Etinan",
    "Ibeno",
    "Ibesikpo Asutan",
    "Ibiono-Ibom",
    "Ika",
    "Ikono",
    "Ikot Abasi",
    "Ikot Ekpene",
    "Ini",
    "Itu",
    "Mbo",
    "Mkpat-Enin",
    "Nsit-Atai",
    "Nsit-Ibom",
    "Nsit-Ubium",
    "Obot Akara",
    "Okobo",
    "Onna",
    "Oron",
    "Oruk Anam",
    "Udung-Uko",
    "Ukanafun",
    "Uruan",
    "Urue-Offong/Oruko",
    "Uyo",
  ],
  anambra: [
    "Aguata",
    "Anambra East",
    "Anambra West",
    "Anaocha",
    "Awka North",
    "Awka South",
    "Ayamelum",
    "Dunukofia",
    "Ekwusigo",
    "Idemili North",
    "Idemili South",
    "Ihiala",
    "Njikoka",
    "Nnewi North",
    "Nnewi South",
    "Ogbaru",
    "Onitsha North",
    "Onitsha South",
    "Orumba North",
    "Orumba South",
    "Oyi",
  ],
  bauchi: [
    "Alkaleri",
    "Bauchi",
    "Bogoro",
    "Damban",
    "Darazo",
    "Dass",
    "Gamawa",
    "Ganjuwa",
    "Giade",
    "Itas/Gadau",
    "Jama'are",
    "Katagum",
    "Kirfi",
    "Misau",
    "Ningi",
    "Shira",
    "Tafawa-Balewa",
    "Toro",
    "Warji",
    "Zaki",
  ],
  bayelsa: [
    "Brass",
    "Ekeremor",
    "Kolokuma/Opokuma",
    "Nembe",
    "Ogbia",
    "Sagbama",
    "Southern Ijaw",
    "Yenagoa",
  ],
  benue: [
    "Ado",
    "Agatu",
    "Apa",
    "Buruku",
    "Gboko",
    "Guma",
    "Gwer East",
    "Gwer West",
    "Katsina-Ala",
    "Konshisha",
    "Kwande",
    "Logo",
    "Makurdi",
    "Obi",
    "Ogbadibo",
    "Ohimini",
    "Oju",
    "Okpokwu",
    "Oturkpo",
    "Tarka",
    "Ukum",
    "Ushongo",
    "Vandeikya",
  ],
  borno: [
    "Abadam",
    "Askira/Uba",
    "Bama",
    "Bayo",
    "Biu",
    "Chibok",
    "Damboa",
    "Dikwa",
    "Gubio",
    "Guzamala",
    "Gwoza",
    "Hawul",
    "Jere",
    "Kaga",
    "Kala/Balge",
    "Konduga",
    "Kukawa",
    "Kwaya Kusar",
    "Mafa",
    "Magumeri",
    "Maiduguri",
    "Marte",
    "Mobbar",
    "Monguno",
    "Ngala",
    "Nganzai",
    "Shani",
  ],
  "cross river": [
    "Abi",
    "Akamkpa",
    "Akpabuyo",
    "Bakassi",
    "Bekwarra",
    "Biase",
    "Boki",
    "Calabar Municipal",
    "Calabar South",
    "Etung",
    "Ikom",
    "Obanliku",
    "Obubra",
    "Obudu",
    "Odukpani",
    "Ogoja",
    "Yakuur",
    "Yala",
  ],
  delta: [
    "Aniocha North",
    "Aniocha South",
    "Bomadi",
    "Burutu",
    "Ethiope East",
    "Ethiope West",
    "Ika North East",
    "Ika South",
    "Isoko North",
    "Isoko South",
    "Ndokwa East",
    "Ndokwa West",
    "Okpe",
    "Oshimili North",
    "Oshimili South",
    "Patani",
    "Sapele",
    "Udu",
    "Ughelli North",
    "Ughelli South",
    "Ukwuani",
    "Uvwie",
    "Warri North",
    "Warri South",
    "Warri South West",
  ],
  ebonyi: [
    "Abakaliki",
    "Afikpo North",
    "Afikpo South (Edda)",
    "Ebonyi",
    "Ezza North",
    "Ezza South",
    "Ikwo",
    "Ishielu",
    "Ivo",
    "Izzi",
    "Ohaozara",
    "Ohaukwu",
    "Onicha",
  ],
  edo: [
    "Akoko-Edo",
    "Egor",
    "Esan Central",
    "Esan North-East",
    "Esan South-East",
    "Esan West",
    "Etsako Central",
    "Etsako East",
    "Etsako West",
    "Igueben",
    "Ikpoba Okha",
    "Orhionmwon",
    "Oredo",
    "Ovia North-East",
    "Ovia South-West",
    "Owan East",
    "Owan West",
    "Uhunmwonde",
  ],
  ekiti: [
    "Ado Ekiti",
    "Efon",
    "Ekiti East",
    "Ekiti South-West",
    "Ekiti West",
    "Emure",
    "Gbonyin",
    "Ido Osi",
    "Ijero",
    "Ikere",
    "Ikole",
    "Ilejemeje",
    "Irepodun/Ifelodun",
    "Ise/Orun",
    "Moba",
    "Oye",
  ],
  enugu: [
    "Aninri",
    "Awgu",
    "Enugu East",
    "Enugu North",
    "Enugu South",
    "Ezeagu",
    "Igbo Etiti",
    "Igbo Eze North",
    "Igbo Eze South",
    "Isi Uzo",
    "Nkanu East",
    "Nkanu West",
    "Nsukka",
    "Oji River",
    "Udenu",
    "Udi",
    "Uzo Uwani",
  ],
  fct: ["Abaji", "Abuja Municipal", "Bwari", "Gwagwalada", "Kuje", "Kwali"],
  gombe: [
    "Akko",
    "Balanga",
    "Billiri",
    "Dukku",
    "Funakaye",
    "Gombe",
    "Kaltungo",
    "Kwami",
    "Nafada",
    "Shomgom",
    "Yamaltu/Deba",
  ],
  imo: [
    "Aboh Mbaise",
    "Ahiazu Mbaise",
    "Ehime Mbano",
    "Ezinihitte",
    "Ideato North",
    "Ideato South",
    "Ihitte/Uboma",
    "Ikeduru",
    "Isiala Mbano",
    "Isu",
    "Mbaitoli",
    "Ngor Okpala",
    "Njaba",
    "Nkwerre",
    "Nwangele",
    "Obowo",
    "Oguta",
    "Ohaji/Egbema",
    "Okigwe",
    "Orlu",
    "Orsu",
    "Oru East",
    "Oru West",
    "Owerri Municipal",
    "Owerri North",
    "Owerri West",
  ],
  jigawa: [
    "Auyo",
    "Babura",
    "Buji",
    "Biriniwa",
    "Birnin Kudu",
    "Dutse",
    "Gagarawa",
    "Garki",
    "Gumel",
    "Guri",
    "Gwaram",
    "Gwiwa",
    "Hadejia",
    "Jahun",
    "Kafin Hausa",
    "Kaugama",
    "Kazaure",
    "Kiri Kasama",
    "Kiyawa",
    "Maigatari",
    "Malam Madori",
    "Miga",
    "Ringim",
    "Roni",
    "Sule Tankarkar",
    "Taura",
    "Yankwashi",
  ],
  kaduna: [
    "Birnin Gwari",
    "Chikun",
    "Giwa",
    "Igabi",
    "Ikara",
    "Jaba",
    "Jema'a",
    "Kachia",
    "Kaduna North",
    "Kaduna South",
    "Kagarko",
    "Kajuru",
    "Kaura",
    "Kauru",
    "Kubau",
    "Kudan",
    "Lere",
    "Makarfi",
    "Sabon Gari",
    "Sanga",
    "Soba",
    "Zango Kataf",
    "Zaria",
  ],
  kano: [
    "Ajingi",
    "Albasu",
    "Bagwai",
    "Bebeji",
    "Bichi",
    "Bunkure",
    "Dala",
    "Dambatta",
    "Dawakin Kudu",
    "Dawakin Tofa",
    "Doguwa",
    "Fagge",
    "Gabasawa",
    "Garko",
    "Garun Mallam",
    "Gaya",
    "Gezawa",
    "Gwale",
    "Gwarzo",
    "Kabo",
    "Kano Municipal",
    "Karaye",
    "Kibiya",
    "Kiru",
    "Kumbotso",
    "Kunchi",
    "Kura",
    "Madobi",
    "Makoda",
    "Minjibir",
    "Nasarawa",
    "Rano",
    "Rimin Gado",
    "Rogo",
    "Shanono",
    "Sumaila",
    "Takai",
    "Tarauni",
    "Tofa",
    "Tsanyawa",
    "Tudun Wada",
    "Ungogo",
    "Warawa",
    "Wudil",
  ],
  katsina: [
    "Bakori",
    "Batagarawa",
    "Batsari",
    "Baure",
    "Bindawa",
    "Charanchi",
    "Dandume",
    "Danja",
    "Dan Musa",
    "Daura",
    "Dutsi",
    "Dutsin Ma",
    "Faskari",
    "Funtua",
    "Ingawa",
    "Jibia",
    "Kafur",
    "Kaita",
    "Kankara",
    "Kankia",
    "Katsina",
    "Kurfi",
    "Kusada",
    "Mai'Adua",
    "Malumfashi",
    "Mani",
    "Mashi",
    "Matazu",
    "Musawa",
    "Rimi",
    "Sabuwa",
    "Safana",
    "Sandamu",
    "Zango",
  ],
  kebbi: [
    "Aleiro",
    "Arewa Dandi",
    "Argungu",
    "Augie",
    "Bagudo",
    "Birnin Kebbi",
    "Bunza",
    "Dandi",
    "Fakai",
    "Gwandu",
    "Jega",
    "Kalgo",
    "Koko/Besse",
    "Maiyama",
    "Ngaski",
    "Sakaba",
    "Shanga",
    "Suru",
    "Wasagu/Danko",
    "Yauri",
    "Zuru",
  ],
  kogi: [
    "Adavi",
    "Ajaokuta",
    "Ankpa",
    "Bassa",
    "Dekina",
    "Ibaji",
    "Idah",
    "Igalamela Odolu",
    "Ijumu",
    "Kabba/Bunu",
    "Kogi",
    "Lokoja",
    "Mopa Muro",
    "Ofu",
    "Ogori/Magongo",
    "Okehi",
    "Okene",
    "Olamaboro",
    "Omala",
    "Yagba East",
    "Yagba West",
  ],
  kwara: [
    "Baruten",
    "Edu",
    "Ekiti",
    "Ifelodun",
    "Ilorin East",
    "Ilorin South",
    "Ilorin West",
    "Irepodun",
    "Isin",
    "Kaiama",
    "Moro",
    "Offa",
    "Oke Ero",
    "Oyun",
    "Pategi",
  ],
  lagos: [
    "Agege",
    "Ajeromi-Ifelodun",
    "Alimosho",
    "Amuwo-Odofin",
    "Badagry",
    "Epe",
    "Eti Osa",
    "Ibeju-Lekki",
    "Ifako-Ijaiye",
    "Ikeja",
    "Ikorodu",
    "Kosofe",
    "Lagos Island",
    "Lagos Mainland",
    "Mushin",
    "Ojo",
    "Oshodi-Isolo",
    "Shomolu",
    "Surulere",
  ],
  nasarawa: [
    "Awe",
    "Doma",
    "Karu",
    "Keana",
    "Keffi",
    "Kokona",
    "Lafia",
    "Nasarawa",
    "Nasarawa Egon",
    "Obi",
    "Toto",
    "Wamba",
  ],
  niger: [
    "Agaie",
    "Agwara",
    "Bida",
    "Borgu",
    "Bosso",
    "Chanchaga",
    "Edati",
    "Gbako",
    "Gurara",
    "Katcha",
    "Kontagora",
    "Lapai",
    "Lavun",
    "Magama",
    "Mariga",
    "Mashegu",
    "Mokwa",
    "Moya",
    "Paikoro",
    "Rafi",
    "Rijau",
    "Shiroro",
    "Suleja",
    "Tafa",
    "Wushishi",
  ],
  ogun: [
    "Abeokuta North",
    "Abeokuta South",
    "Ado-Odo/Ota",
    "Egbado North",
    "Egbado South",
    "Ewekoro",
    "Ifo",
    "Ijebu East",
    "Ijebu North",
    "Ijebu North East",
    "Ijebu Ode",
    "Ikenne",
    "Imeko Afon",
    "Ipokia",
    "Obafemi Owode",
    "Odeda",
    "Odogbolu",
    "Ogun Waterside",
    "Remo North",
    "Shagamu",
  ],
  ondo: [
    "Akoko North East",
    "Akoko North West",
    "Akoko South East",
    "Akoko South West",
    "Akure North",
    "Akure South",
    "Ese Odo",
    "Idanre",
    "Ifedore",
    "Ilaje",
    "Ile Oluji/Okeigbo",
    "Irele",
    "Odigbo",
    "Okitipupa",
    "Ondo East",
    "Ondo West",
    "Ose",
    "Owo",
  ],
  osun: [
    "Aiyedaade",
    "Aiyedire",
    "Atakumosa East",
    "Atakumosa West",
    "Boluwaduro",
    "Boripe",
    "Ede North",
    "Ede South",
    "Ife Central",
    "Ife East",
    "Ife North",
    "Ife South",
    "Egbedore",
    "Ejigbo",
    "Ifedayo",
    "Ila",
    "Ilesa East",
    "Ilesa West",
    "Irepodun",
    "Irewole",
    "Isokan",
    "Iwo",
    "Obokun",
    "Odo Otin",
    "Ola Oluwa",
    "Olorunda",
    "Oriade",
    "Orolu",
    "Osogbo",
  ],
  oyo: [
    "Afijio",
    "Akinyele",
    "Atiba",
    "Atisbo",
    "Egbeda",
    "Ibadan North",
    "Ibadan North East",
    "Ibadan North West",
    "Ibadan South East",
    "Ibadan South West",
    "Ibarapa Central",
    "Ibarapa East",
    "Ibarapa North",
    "Ido",
    "Irepo",
    "Iseyin",
    "Itesiwaju",
    "Iwajowa",
    "Kajola",
    "Lagelu",
    "Ogbomosho North",
    "Ogbomosho South",
    "Ogo Oluwa",
    "Olorunsogo",
    "Oluyole",
    "Ona Ara",
    "Orelope",
    "Ori Ire",
    "Oyo",
    "Oyo East",
    "Saki East",
    "Saki West",
    "Surulere (Oyo)",
  ],
  plateau: [
    "Bokkos",
    "Barkin Ladi",
    "Bassa",
    "Jos East",
    "Jos North",
    "Jos South",
    "Kanam",
    "Kanke",
    "Langtang South",
    "Langtang North",
    "Mangu",
    "Mikang",
    "Pankshin",
    "Qua'an Pan",
    "Riyom",
    "Shendam",
    "Wase",
  ],
  rivers: [
    "Abua/Odual",
    "Ahoada East",
    "Ahoada West",
    "Akuku Toru",
    "Andoni",
    "Asari Toru",
    "Bonny",
    "Degema",
    "Emuoha",
    "Eleme",
    "Etche",
    "Gokana",
    "Ikwerre",
    "Khana",
    "Obio/Akpor",
    "Ogba/Egbema/Ndoni",
    "Ogu/Bolo",
    "Okrika",
    "Omuma",
    "Opobo/Nkoro",
    "Oyigbo",
    "Port Harcourt",
    "Tai",
  ],
  sokoto: [
    "Binji",
    "Bodinga",
    "Dange Shuni",
    "Gwadabawa",
    "Goronyo",
    "Gudu",
    "Illela",
    "Isa",
    "Kebbe",
    "Kware",
    "Rabah",
    "Sabon Birni",
    "Shagari",
    "Silame",
    "Sokoto North",
    "Sokoto South",
    "Tambuwal",
    "Tangaza",
    "Tureta",
    "Wamako",
    "Wurno",
    "Yabo",
  ],
  taraba: [
    "Ardo Kola",
    "Bali",
    "Donga",
    "Gashaka",
    "Gassol",
    "Ibi",
    "Jalingo",
    "Karim Lamido",
    "Kumi",
    "Lau",
    "Sardauna",
    "Takum",
    "Ussa",
    "Wukari",
    "Yorro",
    "Zing",
  ],
  yobe: [
    "Bade",
    "Bursari",
    "Damaturu",
    "Fika",
    "Fune",
    "Geidam",
    "Gujba",
    "Gulani",
    "Jakusko",
    "Karasuwa",
    "Machina",
    "Nangere",
    "Nguru",
    "Potiskum",
    "Tarmuwa",
    "Yunusari",
    "Yusufari",
  ],
  zamfara: [
    "Anka",
    "Bakura",
    "Birnin Magaji/Kiyaw",
    "Bukkuyum",
    "Bungudu",
    "Gummi",
    "Gusau",
    "Kaura Namoda",
    "Maradun",
    "Maru",
    "Shinkafi",
    "Talata Mafara",
    "Tsafe",
    "Zurmi",
  ],
};
const formatMoney = (amount: number | string | null | undefined) => {
  if (amount === null || amount === undefined) return "0.00";

  const num = Number(amount);
  if (isNaN(num)) return "0.00";

  return num.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
const formatNigerianPhone = (input: string): string => {
  let digits = input.replace(/\D/g, "");

  if (digits.startsWith("234")) {
    return `+${digits}`;
  }

  if (digits.startsWith("0")) {
    digits = "234" + digits.substring(1);
    return `+${digits}`;
  }

  if (digits.length === 10 && /^[789]/.test(digits)) {
    return `+234${digits}`;
  }

  if (digits.length === 13 && digits.startsWith("234")) {
    return `+${digits}`;
  }

  if (digits.length >= 10) {
    return `+234${digits}`;
  }

  return digits ? `+234${digits}` : "";
};



const getDeviceId = async (): Promise<string> => {
  // Helper function to validate UUID format
  const isValidUUID = (id: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  try {
    // Try to get from SecureStore
    let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    
    if (deviceId && isValidUUID(deviceId)) {
      // Valid ID found - return it
      return deviceId;
    }
    
    if (deviceId && !isValidUUID(deviceId)) {
      // Invalid format - corrupted data, delete it
      console.warn('Corrupted device ID found, deleting:', deviceId);
      await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
    }
    
    // Check backup location (in case SecureStore failed)
    let backupId = await AsyncStorage.getItem(DEVICE_ID_BACKUP_KEY);
    if (backupId && isValidUUID(backupId)) {
      // Restore to SecureStore
      console.log('Restoring device ID from backup:', backupId);
      await SecureStore.setItemAsync(DEVICE_ID_KEY, backupId);
      return backupId;
    }
    
    // Generate NEW ID (only on first install OR complete data loss)
    console.log('Generating new device ID (first time or all data lost)');
    const newDeviceId = Crypto.randomUUID();
    await SecureStore.setItemAsync(DEVICE_ID_KEY, newDeviceId);
    await AsyncStorage.setItem(DEVICE_ID_BACKUP_KEY, newDeviceId);
    
    return newDeviceId;
    
  } catch (error) {
    console.error("SecureStore error, using backup:", error);
    
    // Fallback: try AsyncStorage backup only
    let backupId = await AsyncStorage.getItem(DEVICE_ID_BACKUP_KEY);
    if (backupId) {
      console.log('Using backup ID due to SecureStore error:', backupId);
      return backupId;
    }
    
    // Generate and store in backup only (last resort)
    console.log('Creating emergency backup ID');
    const emergencyId = Crypto.randomUUID();
    await AsyncStorage.setItem(DEVICE_ID_BACKUP_KEY, emergencyId);
    return emergencyId;
  }
};


const clearDeviceId = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
    await AsyncStorage.removeItem(DEVICE_ID_BACKUP_KEY);
    console.log('Device ID cleared successfully');
  } catch (error) {
    console.error("Failed to clear device ID:", error);
  }
};



export function getRawTransactionDate(tx: any): string {
  if (!tx || typeof tx !== "object") return "";

  const val =
    tx.TransactionDate ||
    tx.TransactionDateString ||
    tx.CurrentDate ||
    tx.date ||
    tx.dateStr ||
    tx.transactionDate ||
    tx.created_at ||
    tx.createdAt ||
    tx.created ||
    tx.date_created ||
    tx.createdDate ||
    tx.dateCreated ||
    tx.timestamp ||
    tx.time ||
    tx.updated_at ||
    tx.updatedAt;

  if (val !== undefined && val !== null && val !== "") {
    return String(val);
  }

  return "";
}

export function parseFlexibleDate(dateVal: any): Date | null {
  if (dateVal === undefined || dateVal === null || dateVal === "") return null;

  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? null : dateVal;
  }

  if (typeof dateVal === "number" || (!isNaN(Number(dateVal)) && String(dateVal).trim() !== "")) {
    let num = Number(dateVal);
    if (num > 1000000000 && num < 10000000000) {
      num = num * 1000;
    }
    const d = new Date(num);
    return isNaN(d.getTime()) ? null : d;
  }

  const str = String(dateVal).trim();
  if (!str) return null;

  let d = new Date(str);
  if (!isNaN(d.getTime())) return d;

  if (str.includes(" ")) {
    d = new Date(str.replace(" ", "T"));
    if (!isNaN(d.getTime())) return d;
  }

  const parts = str.split(/[\sT]+/);
  const datePart = parts[0];
  const timePart = parts[1] || "00:00:00";

  const delimiters = ["/", "-"];
  for (const delim of delimiters) {
    if (datePart.includes(delim)) {
      const tokens = datePart.split(delim);
      if (tokens.length === 3) {
        let day = tokens[0];
        let month = tokens[1];
        let year = tokens[2];
        if (year.length === 2) year = "20" + year;

        if (tokens[0].length === 4) {
          year = tokens[0];
          month = tokens[1];
          day = tokens[2];
        }

        const isoStr = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${timePart}`;
        d = new Date(isoStr);
        if (!isNaN(d.getTime())) return d;
      }
    }
  }

  return null;
}

export function resolveTransactionDate(
  tx: any,
  fallbackIso: string = new Date().toISOString()
): string {
  const raw = getRawTransactionDate(tx);
  if (raw) {
    const parsed = parseFlexibleDate(raw);
    if (parsed) {
      return parsed.toISOString();
    }
    return raw;
  }
  return fallbackIso;
}

export {
  dayOptions,
  frequencyOptions,
  providers,
  wealthManagement,
  otherServices,
  billPaymentServices,
  utilityproductOptions,
  utilityserviceItems,
  internetproductOptions,
  internetServiceItems,
  travelProductOptions,
  travelServiceItems,
  cableProductOptions,
  cableServiceItems,
  eventServiceTypes,
  eventServiceItems,
  eventProductOptions,
  bettingServiceItems,
  bettingProductOptions,
  mockTransactions,
  colorGradients,
  colorOptions,
  getBrandLogo,
  getCurrencySymbol,
  nigeriaStates,
  cityOptions,
  genderOptions,
  stateOptions,
  formatMoney,
  formatNigerianPhone,
  getDeviceId,
  clearDeviceId
};

export type { ColorOption, GradientColors, TwoColorGradient };
