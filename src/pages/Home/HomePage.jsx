import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jsPDF } from "jspdf";
import { FaWhatsapp, FaFilePdf, FaArrowRight, FaTimes } from "react-icons/fa";

import "./HomePage.scss";
import Card from "../../components/Card/Card";

const HomePage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [popupType, setPopupType] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState({
    name: "",
    phoneNumber: "",
    place: "",
    transportName: "",
    months: {},
  });
  const [selectedAdmin, setSelectedAdmin] = useState("");
  const [isDeletePopupVisible, setDeletePopupVisible] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isHomeClicked, setIsHomeClicked] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [dispatch, setDispatch] = useState(false);
  const [isWhatsappPopupVisible, setWhatsappPopupVisible] = useState(false);
  const [userToWhatsapp, setUserToWhatsapp] = useState(null);
  const [isTransferPopupVisible, setTransferPopupVisible] = useState(false);
  const [userToTransfer, setUserToTransfer] = useState(null);
  const [targetAdmin, setTargetAdmin] = useState(""); // Selected admin
  const [selectedFilter, setSelectedFilter] = useState("all"); // "all" or "dispatched"

  // pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const startIndex = (page - 1) * itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const months = [
    "Nov",
    "Dec",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
  ];

  const admins = [
    "Home",
    "Raji",
    "Selva Priya",
    "Muthu Lakshmi",
    "Mareeshwari",
    "Saranya",
  ];


  const fetchUsers = async (admin) => {
    if (!admin) return;

    try {
      const response = await fetch(`https://goldfish-app-yunjc.ondigitalocean.app/api/users/${admin}`);
      const data = await response.json();

      const usersWithSerialNumbers = data.map((user, index) => ({
        ...user,
        serialNumber: `${index + 1}${admin.slice(0, 2).toUpperCase()}`,
      }));

      setUsers(usersWithSerialNumbers); // Store all users (including dispatched ones)
      setFilteredUsers(usersWithSerialNumbers.filter(user => !user.isDispatched)); // Show only non-dispatched users
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await fetch("https://goldfish-app-yunjc.ondigitalocean.app/api/users");
      const data = await response.json();

      const usersWithSerialNumbers = data.map((user, index) => ({
        ...user,
        serialNumber: `${index + 1}${user.admin.slice(0, 2).toUpperCase()}`,
      }));

      setUsers(usersWithSerialNumbers); // Store all users (including dispatched ones)
      setFilteredUsers(usersWithSerialNumbers.filter(user => !user.isDispatched)); // Show only non-dispatched users
    } catch (error) {
      console.error("Error fetching all users:", error);
    }
  };

  useEffect(() => {
    if (selectedAdmin) {
      fetchUsers(selectedAdmin);
    }
  }, [selectedAdmin]);


  const handleCardClick = (admin) => {
    if (admin === "Home") {
      fetchAllUsers();
      setIsHomeClicked(true);
    } else {
      setIsHomeClicked(false);
    }

    setUsers([]);
    setFilteredUsers([]);
    setSelectedFilter("all"); // Reset filter when switching admins

    setSelectedAdmin(null);
    setTimeout(() => setSelectedAdmin(admin), 0);
  };

  const handlePopupOpen = (type, user = null) => {
    setPopupType(type);
    setPopupVisible(true);

    if (type === "edit" && user) {
      setCurrentUser(user);

      // Populate all months' data
      const monthsData = {};
      if (user.monthData) {
        user.monthData.forEach((entry) => {
          monthsData[entry.month] = {
            date: entry.date.split("T")[0],
            amount: entry.amount,
            packageDetails: entry.packageDetails,
            numberOfPayments: entry.numberOfPayments
          };
        });
      }

      setUserData({
        name: user.name,
        phoneNumber: user.phoneNumber,
        place: user.place,
        transportName: user.transportName,
        months: monthsData,
      });
    } else if (type === "add") {
      setUserData({
        name: "",
        phoneNumber: "",
        place: "",
        transportName: "",
        months: {},
      });
      setCurrentUser(null);
    }
  };

  const handlePopupClose = () => {
    setPopupVisible(false);
    setDeletePopupVisible(false);
    setUserData({
      name: "",
      phoneNumber: "",
      place: "",
      transportName: "",
      months: {},
    });
    setCurrentUser(null);
  };

  const handleTransferPopupOpen = (user) => {
    setUserToTransfer(user);
    setTransferPopupVisible(true);
  };

  const handleConfirmTransfer = async () => {
    if (!userToTransfer || !targetAdmin) {
      toast.error("Please select an admin to transfer.");
      return;
    }

    console.log(userToTransfer._id, "transfer");


    try {
      const response = await fetch(
        `https://goldfish-app-yunjc.ondigitalocean.app/api/users/transfer/client/${userToTransfer._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newAdmin: targetAdmin }),
        }
      );

      if (response.ok) {
        toast.success(`Client transferred to ${targetAdmin} successfully!`);
        fetchUsers(selectedAdmin); // Refresh current admin's user list
        setTransferPopupVisible(false);
      } else {
        console.error("Error transferring user:", await response.text());
        toast.error("Failed to transfer user.");
      }
    } catch (error) {
      console.error("Error in handleConfirmTransfer:", error);
      toast.error("An error occurred.");
    }
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const handleMonthChange = (month, date, amount, packageDetails, numberOfPayments) => {
    setUserData((prevData) => ({
      ...prevData,
      months: {
        ...prevData.months,
        [month]: { date, amount, packageDetails, numberOfPayments },
      },
    }));
  };

  const handleSubmit = async (e, isDispatching = false) => {
    e.preventDefault();

    try {
      const url =
        popupType === "add"
          ? "https://goldfish-app-yunjc.ondigitalocean.app/api/users"
          : `https://goldfish-app-yunjc.ondigitalocean.app/api/users/${selectedAdmin}/${currentUser._id}`;
      const method = popupType === "add" ? "POST" : "PUT";

      // Prepare the data to send to the backend
      let updatedUserData = { ...userData, admin: selectedAdmin };

      if (isDispatching) {
        // If dispatch is triggered, set the flag instead of removing data
        updatedUserData.isDispatched = true; // New field to mark dispatched records
      } else {
        // Convert months object to monthData array for the backend
        const monthData = Object.entries(updatedUserData.months).map(
          ([month, details]) => ({
            month,
            date: details.date,
            amount: details.amount,
            packageDetails: details.packageDetails,
            numberOfPayments: details.numberOfPayments,
          })
        );
        updatedUserData.monthData = monthData;
      }

      // Send the data to the backend
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUserData),
      });

      if (response.ok) {
        fetchUsers(selectedAdmin);
        handlePopupClose();
        setDispatch(false);
        toast.success(
          popupType === "add"
            ? "Customer added successfully"
            : isDispatching
              ? "Customer dispatched successfully"
              : "Customer details updated successfully"
        );
      } else {
        console.error("Error saving user:", await response.text());
        toast.error("Failed to save user.");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("An error occurred.");
    }
  };

  const handleDeletePopupOpen = (user) => {
    setUserToDelete(user);
    setDeletePopupVisible(true);
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(
        `https://goldfish-app-yunjc.ondigitalocean.app/api/users/${selectedAdmin}/${userToDelete._id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        fetchUsers(selectedAdmin);
        handlePopupClose();
        toast.success("Customer deleted successfully");
        setPage(1);
      } else {
        console.error("Error deleting user:", await response.text());
        toast.error("Failed to delete user.");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("An error occurred.");
    }
  };


  const handleWhatsapp = (user) => {
    setUserToWhatsapp(user);
    setWhatsappPopupVisible(true);
  };

  const confirmWhatsappMessage = async () => {
    console.log(userToWhatsapp);
    // Extracting month and amount
    const month = userToWhatsapp?.monthData[0].month;
    const amount = userToWhatsapp?.monthData[0].amount;
    // const message = `Hello ${userToWhatsapp?.name}, your payment received successfully.`
    const message = `Hello ${userToWhatsapp?.name}, your payment of ₹${amount} for the month of ${month} has been received successfully. Thank you! 😊`;
    const url = `https://wa.me/${userToWhatsapp?.phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    setWhatsappPopupVisible(false);
    setUserToWhatsapp(null);
  }

  const cancelWhatsappMessage = () => {
    setWhatsappPopupVisible(false);
    setUserToWhatsapp(null);
  };

  const handleSearch = () => {
    const query = searchQuery.toLowerCase().trim();  // Use searchQuery state directly

    const filtered = users.filter(user => {
      // Safely extract and convert all user fields to strings for comparison
      const userName = String(user.name || "").toLowerCase();
      const userPhoneNumber = String(user.phoneNumber || "").toLowerCase();
      const userPlace = String(user.place || "").toLowerCase();
      const userTransportName = String(user.transportName || "").toLowerCase();
      const serialNumber = String(user.serialNumber || "").toLowerCase();

      // Check if any packageDetails in monthData matches the query
      const packageMatch = user.monthData?.some(month =>
        String(month.packageDetails || "").toLowerCase().includes(query)
      );

      // Check if the query matches any of the fields
      const isMatchingQuery = (
        serialNumber.includes(query) ||
        userName.includes(query) ||
        userPhoneNumber.includes(query) ||
        userPlace.includes(query) ||
        userTransportName.includes(query) ||
        packageMatch
      );

      // If the filter is set to "dispatched", show only dispatched users
      if (selectedFilter === "dispatched") {
        return user.isDispatched && isMatchingQuery;
      }

      // If the filter is not "dispatched", show non-dispatched users
      return !user.isDispatched && isMatchingQuery;
    });

    setFilteredUsers(filtered);
  };


  useEffect(() => {
    handleSearch();  // Call the filter logic whenever `selectedFilter` or `searchQuery` changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilter, searchQuery]);  // Dependency array makes sure it runs when either of these changes

  const handleDeleteAllDispatched = async () => {
    try {
      const response = await fetch("https://goldfish-app-yunjc.ondigitalocean.app/api/users/clear-dispatched", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        toast.success("All dispatched data cleared successfully");

        // Re-fetch users after deleting dispatched data
        if (selectedAdmin === "Home") {
          fetchAllUsers();
        } else {
          fetchUsers(selectedAdmin);
        }

        setSelectedFilter("all"); // Ensure dropdown resets to "All Data"
      } else {
        console.error("Error clearing dispatched data:", await response.text());
        toast.error("Failed to clear dispatched data.");
      }
    } catch (error) {
      console.error("Error in handleDeleteAllDispatched:", error);
      toast.error("An error occurred while clearing dispatched data.");
    }
  };


  useEffect(() => {
    if (selectedAdmin) {
      if (selectedFilter === "all") {
        fetchUsers(selectedAdmin);
      } else {
        setFilteredUsers(users.filter(user => user.isDispatched));
      }
    }
  }, [selectedFilter, selectedAdmin]); // Trigger re-fetch when dropdown changes


  const downloadReceipt = (
    userName,
    phoneNumber,
    place,
    date,
    amount,
    numberOfPayments,
    packageDetails,
    Month
  ) => {
    const pdf = new jsPDF("l", "mm", "a5"); // Landscape orientation, A5 size

    // Define the month order
    const monthsOrder = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];

    // Find the payment month index (1-based)
    const monthIndex = monthsOrder.indexOf(Month) + 1;
    const monthPaymentText = monthIndex > 0 ? `(${monthIndex} Month Payment)` : "";

    // Outer border
    pdf.setLineWidth(0.5);
    pdf.rect(10, 10, 180, 130);

    // Header
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("JAI GANESH AGENCIES", 105, 20, { align: "center" });
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text("Sivakasi Bus Stand, Near By Sivakasi", 105, 25, { align: "center" });
    pdf.text("Phone: 95286 48996, 37890 72225", 105, 30, { align: "center" });

    // Horizontal line
    pdf.line(10, 35, 190, 35);

    // Receipt details
    pdf.setFontSize(12);
    pdf.text("Receipt No :", 15, 45);
    pdf.text(Date.now().toString(), 50, 45);
    pdf.text("Date :", 140, 45);
    pdf.text(`${new Date(date).toLocaleDateString("en-GB")}`, 160, 45);

    // Recipient details
    pdf.text("Received from :", 15, 60);
    pdf.setFont("helvetica", "bold");
    pdf.text(`${userName}`, 50, 60);

    pdf.setFont("helvetica", "normal");
    pdf.text("Place :", 15, 70);
    pdf.text(`${place}`, 50, 70);

    // Amount
    pdf.text("Amount Paid :", 15, 80);
    pdf.setFont("helvetica", "bold");
    pdf.text(`${amount}`, 50, 80);

    // Package details
    pdf.setFont("helvetica", "bold");
    pdf.text("Month :", 15, 100);
    pdf.text(`${Month} ${monthPaymentText}`, 50, 100);
    pdf.text("Package :", 15, 110);
    pdf.text(`${packageDetails}`, 50, 110);
    pdf.text("No of Payments :", 15, 120);
    pdf.text(`${numberOfPayments}`, 50, 120);

    pdf.save(`Receipt_${userName}.pdf`);
  };


  return (
    <div className="home-container">
      <ToastContainer />
      <div className="home-container__card-container">
        {admins.map((admin) => (
          <Card key={admin} name={admin} onClick={() => handleCardClick(admin)} />
        ))}
      </div>

      <div className="home-container__table-container">
        <div className="home-container__table-container__heading">
          <h2>{selectedAdmin ? `${selectedAdmin}` : "Select an Admin"}</h2>
          {selectedAdmin && (
            <>
              <input
                type="text"
                placeholder="Search by S.No, Name, Phone, Place, Transport Name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}  // Update searchQuery state on change
                className="search-input"
              />


              {selectedAdmin === "Home" && (
                <select
                  className="filter-dropdown"
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                >
                  <option value="all">All Data</option>
                  <option value="dispatched">Dispatched Data</option>
                </select>
              )}

              {selectedAdmin === "Home" && (

                <button
                  onClick={handleDeleteAllDispatched}
                  disabled={selectedFilter !== "dispatched" || filteredUsers.length < 1}
                >
                  Delete All Dispatched Data
                </button>
              )}



              <button onClick={() => handlePopupOpen("add")} disabled={isHomeClicked}>Add User</button>

            </>
          )}
        </div>

        {selectedAdmin && (
          <div className="home-container__table-container__table-div">
            <table className="home-container__table-container__table-div__table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Place</th>
                  <th>Transport Name</th>
                  {months.map((month) => (
                    <th key={month}>{month}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (

                  filteredUsers.map((user) => {
                    return (
                      <tr key={user._id}>
                        <td>{user.serialNumber}</td>
                        <td>{user.name}</td>
                        <td>{user.phoneNumber}</td>
                        <td>{user.place}</td>
                        <td>{user.transportName || "-"}</td>
                        {months.map((month) => {
                          const monthEntry = user.monthData?.find((data) => data.month === month);
                          return (
                            <td key={month}>
                              {monthEntry ? (
                                <>Date:
                                  {new Date(monthEntry.date).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  })}
                                  <br />
                                  <span>Amount:₹{monthEntry.amount}</span>
                                  <br />
                                  <span>Package:{monthEntry.packageDetails}</span>
                                  <br />
                                  <span>Payments:{monthEntry.numberOfPayments}</span>

                                  <div className="icon-buttons">
                                    <button
                                      className="icon-button whatsapp-button"
                                      onClick={() => handleWhatsapp(user)}
                                      disabled={isHomeClicked}
                                    >
                                      <FaWhatsapp className="icon" />
                                    </button>
                                    <button
                                      className="icon-button pdf-button"
                                      onClick={() => downloadReceipt(user.name, user.phoneNumber, user.place, monthEntry.date, monthEntry.amount, monthEntry.numberOfPayments, monthEntry.packageDetails, month)}
                                      disabled={isHomeClicked}
                                    >
                                      <FaFilePdf className="icon" />
                                    </button>
                                  </div>

                                </>
                              ) : (
                                "-"
                              )}
                            </td>
                          );
                        })}
                        <td className="home-container__table-container__table-div__table__action">
                          <div className="home-container__table-container__table-div__table__action__container">

                            <button onClick={() => handlePopupOpen("edit", user)} disabled={isHomeClicked}>Edit</button>
                            <button onClick={() => handleTransferPopupOpen(user)} disabled={isHomeClicked}>
                              <FaArrowRight />
                            </button>

                            <button onClick={() => handleDeletePopupOpen(user)} disabled={isHomeClicked}>Delete</button>
                          </div>

                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={months.length + 6} style={{ textAlign: "center" }}>
                      No data found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* mobile-view */}
            <div className="mobile-view">
              {currentUsers.length > 0 ? (
                currentUsers.map((user) => (
                  <div key={user._id} className="user-card">
                    <p><strong>S.No:</strong> {user.serialNumber}</p>
                    <p><strong>Name:</strong> {user.name}</p>
                    <p><strong>Phone:</strong> {user.phoneNumber}</p>
                    <p><strong>Place:</strong> {user.place}</p>
                    <p><strong>Transport:</strong> {user.transportName || "-"}</p>

                    {/* Show month-wise payment details only if data exists */}
                    {user.monthData && user.monthData.length > 0 && (
                      <div className="month-details">
                        {months.map((month) => {
                          const monthEntry = user.monthData?.find((data) => data.month === month);
                          return (
                            monthEntry && ( // Only render if monthEntry exists
                              <div key={month} className="month-card">
                                <h4>{month}</h4>
                                <p><strong>Date:</strong> {new Date(monthEntry.date).toLocaleDateString("en-GB")}</p>
                                <p><strong>Amount:</strong> ₹{monthEntry.amount}</p>
                                <p><strong>Package:</strong> {monthEntry.packageDetails}</p>
                                <p><strong>Payments:</strong> {monthEntry.numberOfPayments}</p>

                                {/* Action Buttons */}
                                <div className="icon-buttons">
                                  <button
                                    className="icon-button whatsapp-button"
                                    onClick={() => handleWhatsapp(user)}
                                    disabled={isHomeClicked}
                                  >
                                    <FaWhatsapp className="icon" />
                                  </button>
                                  <button
                                    className="icon-button pdf-button"
                                    onClick={() => downloadReceipt(user.name, user.phoneNumber, user.place, monthEntry.date, monthEntry.amount, monthEntry.numberOfPayments, monthEntry.packageDetails, month)}
                                    disabled={isHomeClicked}
                                  >
                                    <FaFilePdf className="icon" />
                                  </button>
                                </div>
                              </div>
                            )
                          );
                        })}
                      </div>
                    )}

                    {/* User Action Buttons */}
                    <div className="user-actions">
                      <button onClick={() => handlePopupOpen("edit", user)} disabled={isHomeClicked}>Edit</button>
                      <button onClick={() => handleTransferPopupOpen(user)} disabled={isHomeClicked}>
                        <FaArrowRight />
                      </button>
                      <button onClick={() => handleDeletePopupOpen(user)} disabled={isHomeClicked}>Delete</button>
                    </div>
                  </div>
                ))
              ) : (
                // Show "No Data Found" if no users
                <div className="no-data-message">
                  <p>No data found</p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && currentUsers.length > 0 && (
                <div className="pagination">
                  <button onClick={() => setPage(page - 1)} disabled={page === 1}>Prev</button>
                  <span>Page {page} of {totalPages}</span>
                  <button onClick={() => setPage(page + 1)} disabled={page >= totalPages}>Next</button>
                </div>
              )}
            </div>




          </div>
        )}

      </div>

      {isPopupVisible && (
        <div className="home-container-popup">
          <div className="home-container-popup__content add-edit-popup">
            <div className="close-button-container">
              <button className="close-button-container__close-button" onClick={handlePopupClose}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <h3>{popupType === "add" ? "Add New User" : "Edit User"}</h3>

              <div>
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={userData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label>Phone Number</label>
                <input
                  type="number"
                  name="phoneNumber"
                  value={userData.phoneNumber}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label>Place</label>
                <input
                  type="text"
                  name="place"
                  value={userData.place}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label>Transport Name</label>
                <input
                  type="text"
                  name="transportName"
                  value={userData.transportName}
                  onChange={handleInputChange}
                />
              </div>
              {months.map((month) => (
                <div key={month}>
                  <label>{month}</label>
                  <div className="date-container">
                    <span>Date:&nbsp;</span>
                    <input
                      type="date"
                      value={userData.months[month]?.date || ""}
                      onChange={(e) =>
                        handleMonthChange(
                          month,
                          e.target.value, // date
                          userData.months[month]?.amount || "",
                          userData.months[month]?.packageDetails || "",
                          userData.months[month]?.numberOfPayments || ""
                        )
                      }
                    />
                  </div>

                  <input
                    type="number"
                    placeholder="Amount"
                    value={userData.months[month]?.amount || ""}
                    onChange={(e) =>
                      handleMonthChange(
                        month,
                        userData.months[month]?.date || "",
                        e.target.value, // amount
                        userData.months[month]?.packageDetails || "",
                        userData.months[month]?.numberOfPayments || ""
                      )
                    }
                    onWheel={(e) => e.target.blur()}
                  />
                  <input
                    type="text"
                    placeholder="Package Details"
                    value={userData.months[month]?.packageDetails || ""}
                    onChange={(e) =>
                      handleMonthChange(
                        month,
                        userData.months[month]?.date || "",
                        userData.months[month]?.amount || "",
                        e.target.value, // packageDetails
                        userData.months[month]?.numberOfPayments || ""
                      )
                    }
                  />
                  <input
                    type="number"
                    placeholder="Number of payments"
                    value={userData.months[month]?.numberOfPayments || ""}
                    onChange={(e) =>
                      handleMonthChange(
                        month,
                        userData.months[month]?.date || "",
                        userData.months[month]?.amount || "",
                        userData.months[month]?.packageDetails || "",
                        e.target.value // numberOfPayments
                      )
                    }
                    onWheel={(e) => e.target.blur()}
                  />
                </div>
              ))}

              <div className="form__actions">
                <button type="submit">
                  {popupType === "add" ? "Save" : "Update"}
                </button>
                <button type="button" onClick={handlePopupClose}>
                  Cancel
                </button>

                <button
                  type="submit"
                  onClick={(e) => handleSubmit(e, true)} // Passing true to indicate dispatch
                >
                  Dispatch
                </button>


              </div>

            </form>
          </div>
        </div>
      )}

      {isDeletePopupVisible && (
        <div className="home-container-popup">
          <div className="home-container-popup__delete-content delete-popup">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this client?</p>
            <div className="form__actions">
              <button type="submit" onClick={handleDelete}>
                Yes, Delete
              </button>
              <button type="button" onClick={handlePopupClose}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isWhatsappPopupVisible && (
        <div className="home-container-popup">
          <div className="home-container-popup__whatsapp-content whatsapp-popup">
            <h3>Confirm WhatsApp Message</h3>
            <p>
              Are you sure you want to send a WhatsApp message to{" "}
              <strong>{userToWhatsapp?.name}</strong>?
            </p>
            <div className="form__actions">
              <button type="submit" onClick={confirmWhatsappMessage}>Yes, Send</button>
              <button type="button" onClick={cancelWhatsappMessage}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {isTransferPopupVisible && (
        <div className="home-container-popup">
          <div className="home-container-popup__transfer-content transfer-popup">
            <h3>Transfer Client</h3>
            <p>Are you sure you want to transfer <strong>{userToTransfer?.name}</strong> to another admin?</p>

            <select onChange={(e) => setTargetAdmin(e.target.value)} value={targetAdmin}>
              <option value="">Select Admin</option>
              {admins
                .filter((admin) => admin !== "Home" && admin !== selectedAdmin) // Exclude "Home" & selected admin
                .map((admin) => (
                  <option key={admin} value={admin}>{admin}</option>
                ))}
            </select>


            <div className="form__actions">
              <button type="submit" onClick={handleConfirmTransfer}>Confirm Transfer</button>
              <button type="button" onClick={() => setTransferPopupVisible(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HomePage;







