import React from "react";
import { Text, View } from "react-native";

type PolicySection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

const sections: PolicySection[] = [
  {
    title: "Introduction",
    paragraphs: [
      'Ellington Microfinance Bank Limited ("Ellington", "we", "us" or "our") is a Central Bank of Nigeria (CBN) licensed microfinance bank. We are committed to protecting the privacy and security of the personal and financial information of our customers, prospective customers, agents and website visitors ("you").',
      'This Privacy Policy explains what information we collect, how we use it, who we share it with and the rights you have. It applies to our website, mobile applications, agency banking channels and any other service we provide (together, the "Services"). This policy is issued in line with the Nigeria Data Protection Act 2023 (NDPA), the Nigeria Data Protection Regulation (NDPR) and applicable CBN guidelines.',
    ],
  },
  {
    title: "Information we collect",
    bullets: [
      "Identity & KYC data: full name, date of birth, gender, photograph, signature, BVN, NIN, government-issued ID, proof of address and employment details.",
      "Contact data: residential address, email address and phone numbers.",
      "Financial & transaction data: account balances, transaction history, transfers, card usage, loan and repayment records.",
      "Device & technical data: IP address, device identifiers, operating system, app version, location (where permitted), cookies and analytics data.",
      "Correspondence: messages, call recordings and support tickets exchanged with our customer service teams.",
    ],
  },
  {
    title: "How we use your information",
    bullets: [
      "Open, operate and administer your accounts and provide banking services.",
      "Meet KYC, AML/CFT, tax and other legal or regulatory obligations.",
      "Process payments, transfers, POS, agency and international remittance transactions.",
      "Detect, prevent and investigate fraud, financial crime and security incidents.",
      "Improve our products, personalise your experience and provide customer support.",
      "Send service, security and — where you have consented — marketing communications.",
    ],
  },
  {
    title: "Lawful basis for processing",
    paragraphs: [
      "We rely on one or more of the following lawful bases: performance of a contract with you, compliance with a legal obligation, your consent, our legitimate interests (such as securing our systems and preventing fraud), and, where applicable, tasks carried out in the public interest.",
    ],
  },
  {
    title: "Who we share information with",
    paragraphs: ["We do not sell your personal information. We share it only where necessary with:"],
    bullets: [
      "Regulators and authorities including the Central Bank of Nigeria (CBN), Nigeria Deposit Insurance Corporation (NDIC), Nigerian Financial Intelligence Unit (NFIU), FIRS and law enforcement.",
      "Payment and settlement partners such as NIBSS, Interswitch, card schemes and correspondent banks to process transactions.",
      "KYC, credit bureau, identity verification and fraud prevention providers.",
      "Trusted service providers who host, secure and maintain our technology, under written data-processing agreements.",
      "Professional advisers, auditors and insurers where required.",
    ],
  },
  {
    title: "How we protect your information",
    paragraphs: [
      "We apply technical and organisational measures — encryption in transit and at rest, access controls, network segmentation, monitoring and regular reviews — to protect your information. No system is entirely secure, so we also ask you to safeguard your login credentials, PINs and OTPs, and to report any suspicious activity to us immediately.",
    ],
  },
  {
    title: "Data retention",
    paragraphs: [
      "We retain personal and transaction data for as long as your relationship with us is active and for the periods required by CBN and other applicable laws (typically a minimum of ten years after account closure for financial records). After the retention period we securely delete or anonymise the data.",
    ],
  },
  {
    title: "Cookies & analytics",
    paragraphs: [
      "Our website uses cookies and similar technologies to remember your preferences, keep the site secure and understand how it is used. You can control cookies through your browser settings; disabling them may affect parts of the site.",
    ],
  },
  {
    title: "Your rights",
    paragraphs: ["Subject to applicable law, you have the right to:"],
    bullets: [
      "Access the personal information we hold about you.",
      "Request correction of inaccurate or incomplete information.",
      "Request deletion of your information, subject to our legal and regulatory retention obligations.",
      "Object to or restrict certain processing, including direct marketing.",
      "Withdraw consent where processing is based on consent.",
      "Lodge a complaint with the Nigeria Data Protection Commission (NDPC).",
    ],
  },
  {
    title: "Children’s privacy",
    paragraphs: [
      "Our Services are not directed to children under 18. We do not knowingly collect information from children without parental or guardian consent.",
    ],
  },
  {
    title: "Changes to this policy",
    paragraphs: [
      "We may update this policy from time to time. Material changes will be communicated through our website or the mobile app. The date at the top of this page indicates when it was last revised.",
    ],
  },
  {
    title: "Contact us",
    paragraphs: [
      "Data Protection Officer\nEllington Microfinance Bank Limited\nKon-X Place, KM 14 Lekki Expressway, Lekki Phase 2, Lagos, Nigeria\n\nEmail: privacy@ellingtonbank.com\nSupport: support@ellingtonbank.com\nPhone: +234 704 267 8421",
      "To exercise any of your rights, email privacy@ellingtonbank.com. We will respond within the timeframes set by the NDPA.",
    ],
  },
];

export default function PrivacyPolicyContent({ dark = false }: { dark?: boolean }) {
  const bodyColor = dark ? "text-accent-100" : "text-gray-700";
  const titleColor = dark ? "text-white" : "text-gray-900";

  return (
    <View className="gap-5">
      {sections.map((section) => (
        <View key={section.title} className="gap-2">
          <Text className={`${titleColor} text-sm font-outfit-bold`}>
            {section.title}
          </Text>
          {section.paragraphs?.map((paragraph, index) => (
            <Text key={`${section.title}-p-${index}`} className={`${bodyColor} text-xs leading-5 font-outfit`}>
              {paragraph}
            </Text>
          ))}
          {section.bullets?.map((bullet, index) => (
            <Text key={`${section.title}-b-${index}`} className={`${bodyColor} text-xs leading-5 font-outfit`}>
              • {bullet}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}
