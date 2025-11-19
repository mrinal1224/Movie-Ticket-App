import React from "react";
import { Modal, Table } from "antd";

const ShowModal = ({ isShowModalOpen, setIsShowModalOpen }) => {

   function handleCancel(){
    setIsShowModalOpen(false)
   }


  const columns = [
    {
      title: "ShowName",
    },
    {
      title: "Show Date",
    },
    {
      title: "Show Time",
    },
    {
      title: "Movie",
    },

    {
      title: "Theatre",
    },

    {
      title: "Total Seats",
    },
    {
      title: "Ticket Price",
    },
    {
      title: "Availbale Seats",
    },
  ];

  return (
    <>
      <Modal width={1200} onCancel={handleCancel} open={isShowModalOpen}>
        <Table columns={columns}></Table>
      </Modal>
    </>
  );
};

export default ShowModal;
