import React, { useState } from "react";
import { Modal } from "zmp-ui";

export const ChonBan = () => {
  const [modalVisible, setModalVisible] = useState(true); // Mở modal khi component được render
  const [selectedTable, setSelectedTable] = useState(null);

  const handleTableSelect = (table) => {
    setSelectedTable(table);
    setModalVisible(false);
  };

  const renderTableButtons = () => {
    const tables = [
      '01', '02', '03', '04', '05',
      '06', '07', '08', '09', '10',
      '11', '12', '13', '14', '15',
      '16', '17', '18', '19', '20'
    ];

    return (
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {tables.map((table) => (
          <button
            key={table}
            onClick={() => handleTableSelect(table)}
            style={{
              margin: '5px',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '5px',
              backgroundColor: selectedTable === table ? '#197df8' : 'white',
              color: selectedTable === table ? 'white' : 'black',
              width: '50px',
              height: '50px'
            }}
          >
            {table}
          </button>
        ))}
      </div>
    );
  };

  return (
    <Modal
      visible={modalVisible}
      title="Sơ đồ chọn bàn"
      onClose={() => {
        setModalVisible(false);
      }}
      zIndex={1200}
      actions={[
        {
          text: "Thoát",
          close: true,
          highLight: false,
          danger: true
        },
      ]}
      description="Quý khách vui lòng chọn bàn và chờ trong ít phút, nhân viên sẽ phục vụ Quý khách ngay ạ!"
    >
      <br></br>
      {renderTableButtons()}

    </Modal>
  );
};