import React from "react";
import VirtualCardPreview from "@/app/components/VirtualCardPreview";

interface VirtualCardSectionProps {
  activeTab: string;
  showCardDetails: boolean;
}

const VirtualCardSection: React.FC<VirtualCardSectionProps> = ({
  activeTab,
  showCardDetails,
}) => {
  return (
    <VirtualCardPreview activeTab={activeTab} showDetails={showCardDetails} />
  );
};

export default VirtualCardSection;
