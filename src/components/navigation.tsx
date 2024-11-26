import { useVirtualKeyboardVisible } from "hooks";
import React, { FC, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { MenuItem } from "types/menu";
import { BottomNavigation, Icon, Modal, Button } from "zmp-ui";
import { CartIcon } from "./cart-icon";
import { openChat, getUserInfo } from 'zmp-sdk/apis';
import { useSetRecoilState } from "recoil";
import { updateUserInfo, userState } from "state";

const tabs: Record<string, MenuItem> = {
  "/": {
    label: "Trang chủ",
    icon: <Icon icon="zi-home" />,
  },
  "/cart": {
    label: "Giỏ hàng",
    icon: <CartIcon />,
    activeIcon: <CartIcon active />,
  },
  "/chat": {
    label: "Liên hệ",
    icon: <Icon icon="zi-chat" />,
  }
};

export type TabKeys = keyof typeof tabs;

export const NO_BOTTOM_NAVIGATION_PAGES = ["/search", "/category", "/result"];

export const Navigation: FC = () => {
  const [activeTab, setActiveTab] = useState<TabKeys>("/");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [hasUserInfoModalBeenClosed, setHasUserInfoModalBeenClosed] = useState(false); // Thêm trạng thái này
  const keyboardVisible = useVirtualKeyboardVisible();
  const navigate = useNavigate();
  const location = useLocation();
  const setUserState = useSetRecoilState(userState);

  const noBottomNav = useMemo(() => {
    return NO_BOTTOM_NAVIGATION_PAGES.includes(location.pathname);
  }, [location]);

  if (noBottomNav || keyboardVisible) {
    return <></>;
  }

  const openChatScreen = () => {
    openChat({
      type: 'oa',
      id: '4034193284491636322',
      message: 'Xin Chào',
      success: () => {
        // Handle success if needed
      },
      fail: (err) => {
        // Handle failure if needed
      }
    });
  };

  const handleCartClick = () => {
    if (!hasUserInfoModalBeenClosed) { // Kiểm tra nếu modal chưa được đóng
      setIsModalVisible(true); // Hiển thị modal khi người dùng nhấn vào Giỏ hàng
    } else {
      navigate("/cart"); // Điều hướng vào trang Giỏ hàng nếu modal đã được đóng
    }
  };

  const handleGetUserInfo = async () => {
    try {
      await updateUserInfo(setUserState); // Gọi updateUserInfo để lưu thông tin người dùng vào Recoil state
      setIsModalVisible(false); // Đóng modal sau khi lấy được thông tin
      setHasUserInfoModalBeenClosed(true); // Đánh dấu rằng modal đã được đóng
      navigate("/cart"); // Điều hướng vào trang Giỏ hàng
    } catch (error) {
      console.error("Không thể lấy thông tin người dùng:", error);
    }
  };

  return (
    <>
      <BottomNavigation
        id="footer"
        activeKey={activeTab}
        onChange={(key: TabKeys) => setActiveTab(key)}
        className="z-50"
      >
        {Object.keys(tabs).map((path: TabKeys) => (
          <BottomNavigation.Item
            key={path}
            label={tabs[path].label}
            icon={tabs[path].icon}
            activeIcon={tabs[path].activeIcon}
            onClick={() => {
              if (path === "/chat") {
                openChatScreen(); // Gọi hàm openChatScreen khi nhấn vào tab chat
              } else if (path === "/cart") {
                handleCartClick(); // Hiển thị modal khi nhấn vào tab Giỏ hàng
              } else {
                navigate(path); // Điều hướng đến các trang khác
              }
            }}
          />
        ))}
      </BottomNavigation>

      {/* Modal yêu cầu quyền getUserInfo */}
      {isModalVisible && (
        <Modal
          visible={isModalVisible}
          title="DAKAI Cafe thông báo"
          onClose={() => setIsModalVisible(false)}
          actions={[
            {
              text: "OK",
              highLight: true,
              onClick: handleGetUserInfo,
            },
          ]}
          coverSrc="https://res.cloudinary.com/dqcrcdufy/image/upload/v1730724555/Th%C3%AAm_ti%C3%AAu_%C4%91%E1%BB%81_7_w2p2lu.png"
        >
        </Modal>
      )}
    </>
  );
};
