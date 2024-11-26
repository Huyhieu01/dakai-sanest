import React, { FC, MouseEventHandler, ReactNode } from "react";
import { Box, Icon, Text } from "zmp-ui";

export interface TheThanhVienProps {
  title: ReactNode;
  subtitle: ReactNode;
  onClick?: MouseEventHandler<HTMLDivElement>;
  isLoading?: boolean;
}

export const TheThanhVien: FC<TheThanhVienProps> = ({ title, subtitle, onClick }) => {
  return (
    <Box flex className="space-x-2" onClick={onClick}>
      <Box className="flex-1 space-y-[2px]">
        <Text size="small" className="text-base">
          {title}
        </Text>
        <Text size="xSmall" className="text-gray">
          {subtitle}
        </Text>
      </Box>
      <Icon icon="zi-chevron-right" />
    </Box>
  );
};
