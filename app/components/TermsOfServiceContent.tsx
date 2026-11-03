import React from "react";
import { Text, View } from "react-native";

const sections = [
  {
    title: "Introduction",
    paragraphs: [
      'Welcome to Ellington Microfinance Bank Limited ("Ellington Bank", "we", "us", or "our"). By downloading, installing, accessing, or using the Ellington Bank Mobile Application (the "App") or opening an account with us, you agree to be bound by these Terms of Service ("Terms"). Please read them carefully before proceeding.',
    ],
  },
  {
    title: "Structure & Commencement",
    paragraphs: [
      "Agreement Scope: These Terms set out the complete contract between you (the \"Borrower\", \"User\", or \"End-User\") and Ellington Microfinance Bank Limited, a company duly incorporated under the laws of the Federal Republic of Nigeria, licensed by the Central Bank of Nigeria (CBN), and insured by the Nigerian Deposit Insurance Corporation (NDIC).",
      'Effective Date: These Terms take effect upon your downloading of the App, creation of an Account, or clicking "Accept", "Continue", or any equivalent prompt signifying acceptance on our system.',
      "Duration: This Agreement remains effective for the entire duration of your account ownership with Ellington Bank, the installation of the App on your device, and until the total settlement of all outstanding financial obligations, loans, and fees due to Ellington Bank.",
    ],
  },
  {
    title: "Definitions & Interpretation",
    paragraphs: [
      '"Account" means your digital microfinance banking or savings account held with Ellington Microfinance Bank Limited.',
      '"BVN" means Bank Verification Number issued by the Central Bank of Nigeria.',
      '"Credit Reference Bureau" means any financial institution or credit bureau duly licensed by the CBN to collect and facilitate the sharing of customer credit information.',
      '"Equipment" includes your mobile device, SIM card, hardware, and operating system used to access the App.',
      '"Event of Default" means any condition specified in Section 7 of this Agreement.',
      '"GSI" means Global Standing Instruction mandated by the Central Bank of Nigeria for direct debt recovery across financial institutions.',
      '"Loan" means the principal amount, interest, and associated service fees extended to you by Ellington Bank via the App.',
      '"NDPA" means the Nigeria Data Protection Act 2023, along with all applicable data protection regulations issued by the Nigeria Data Protection Commission (NDPC).',
    ],
  },
  {
    title: "Acceptance of Terms & Eligibility",
    paragraphs: [
      "Age Requirement: You must be at least 18 years of age to use our services or apply for credit facilities.",
      'Binding Acceptance: Clicking "Accept", "Continue", or applying for a service on the Ellington Bank system constitutes your legal, digital signature and intention to be bound by these Terms and our Privacy Policy. If you do not agree, do not proceed or use the App.',
      "Information Authenticity: You warrant that all personal details, BVN, NIN, contact addresses, and financial declarations provided during registration are accurate and up to date.",
    ],
  },
  {
    title: "Grant of App License & Intellectual Property",
    paragraphs: [
      "License Grant: Ellington Bank grants you a limited, non-transferable, non-exclusive, revocable license to use the App on your mobile device strictly for personal banking and applying for credit facilities in accordance with these Terms.",
      "License Restrictions: You explicitly agree not to copy, modify, distribute, reverse engineer, or misuse the App or any part of it.",
      "Intellectual Property Rights: All software, design, branding, code, trademarks, user interfaces, and technical documentation related to Ellington Bank and the App remain the exclusive property of Ellington Microfinance Bank Limited worldwide.",
    ],
  },
  {
    title: "Account Security & Verification",
    paragraphs: [
      "Credential Safety: You are solely responsible for maintaining the confidentiality of your PIN, password, biometric login data, and transaction credentials. Any activity conducted through your device using your credentials will be deemed executed by you.",
      "Third-Party Verification: You grant Ellington Bank express authorization to verify your identity, BVN, NIN, and bank details with official databases and licensed Payment System Providers.",
      "Unauthorized Access: You must notify Ellington Bank support immediately if you suspect unauthorized access or compromise of your login details.",
    ],
  },
  {
    title: "Financial Services, Deposits & Lending Operations",
    paragraphs: [
      "Banking Procedures: Transactions, transfers (NIP, NEFT, RTGS), and savings are processed in line with CBN guidelines and NDIC protection thresholds.",
      "Irreversibility of Transfers: Once a transfer or payment is authorized via your PIN or biometrics and successfully credited to a beneficiary, the transaction is final under CBN instant payment guidelines. Erroneous transfers must be reported immediately for formal recovery protocols.",
      "Discretion over Lending: Opening an account with Ellington Bank does not guarantee loan approval. Ellington Bank reserves the absolute right to approve, decline, adjust interest rates, or vary credit limits based on our internal credit-scoring models without providing specific reasons.",
      "Data Subject Rights: Subject to statutory legal obligations, you hold rights under the NDPA to access, correct, object to, or request the erasure of your personal data by contacting our Data Protection Officer at support@ellingtonbank.com.",
    ],
  },
  {
    title: "Loan Repayment, Default, and Recovery Mechanisms",
    paragraphs: [
      "You agree to repay all amounts due on the dates stated in your loan offer. Late or missed payments may attract applicable fees, affect your credit profile, and result in recovery action under these Terms and applicable Nigerian law.",
    ],
  },
  {
    title: "Contact us",
    paragraphs: [
      "For questions about these Terms, contact Ellington Microfinance Bank Limited through support@ellingtonbank.com or the support channels made available in the App.",
    ],
  },
];

export default function TermsOfServiceContent({ dark = false }: { dark?: boolean }) {
  const bodyColor = dark ? "text-accent-100" : "text-gray-700";
  const titleColor = dark ? "text-white" : "text-gray-900";

  return (
    <View className="gap-5">
      {sections.map((section) => (
        <View key={section.title} className="gap-2">
          <Text className={`${titleColor} text-sm font-outfit-bold`}>
            {section.title}
          </Text>
          {section.paragraphs.map((paragraph, index) => (
            <Text key={`${section.title}-${index}`} className={`${bodyColor} text-xs leading-5 font-outfit`}>
              {paragraph}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}
