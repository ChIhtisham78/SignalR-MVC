function getUserEmail(userEmail) {
    // Add logic to fetch the user's email address from your authentication system or elsewhere
    // Return the user's email address
    return "user@example.com"; // Replace with the actual user's email address
}

$(function () {
    getUserEmail();
    var connection = new signalR.HubConnectionBuilder().withUrl("/chatHub").build();
    var currentUsername = "";
    var activeChatRoom = "";
    function sendImage(toUserEmail, formData) {
        console.log("Sending image to: " + toUserEmail);
        $.ajax({
            type: "POST",
            url: '/Upload/AddOrEdit',
            data: formData,
            processData: false,
            contentType: false,
            headers: { 'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val() },
            success: function (response, textStatus, xhr) {
                if (response.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Image Uploaded',
                        text: 'Your image has been uploaded successfully!',
                        showConfirmButton: false,
                        timer: 2000,
                    });
                    var isImage = true;
                    connection.invoke("SendImage", toUserEmail, response.fileUrl, isImage)
                        .then(function () {
                            console.log("Image sent successfully.");
                            displayMessage(currentUsername, response.fileUrl, true, response.fileUrl);
                            $("#messageInput").val("");
                        })
                        .catch(function (err) {
                            console.error("Error sending image: " + err.toString());
                            console.error(err.toString());
                          });
                }
            },
            error: function (xhr, textStatus, errorThrown) {
                console.error(xhr.status + ":" + errorThrown);
            }
        });
    }

    function displayMessage(fromUserEmail, message, isImage, imageUrl) {
        var msgContent;
        createChatRoomIfNotExists(fromUserEmail);
        if (activeChatRoom !== fromUserEmail) {
            $(".chat-room[data-chatroom='" + fromUserEmail + "']").addClass("new-message");
        }
        $(".chat-room[data-chatroom='" + fromUserEmail + "']").attr("data-email", fromUserEmail);

        if (isImage) {
            msgContent = `<img src="${imageUrl}" class="image-message"/>`;
        } else {
            msgContent = message;
        }
        var senderLabel = fromUserEmail === currentUsername ? "Me" : fromUserEmail;
        var msgLabel = `<span class="msg-label">${senderLabel}: ${msgContent}</span>`;
        var msgBubble = `<li class="message ${fromUserEmail === currentUsername ? 'sent' : 'received'}">${msgLabel}</li>`;
        $("#messages").append(msgBubble);
        $("#chatContainer").scrollTop($("#messages").height());
        createChatRoomIfNotExists(fromUserEmail);
        if (activeChatRoom !== fromUserEmail) {
            $(".chat-room[data-chatroom='" + fromUserEmail + "']").addClass("new-message");
        }
    }
    function sendMessage() {
        var toUserEmail = activeChatRoom;
        var message = $("#messageInput").val().trim();
        let file = $("#Image-Upload").get(0).files;
        if (message === "" && (!file || file.length === 0)) {
            return;
        }
        if (file && file.length > 0) {
            let formData = new FormData();
            formData.append("content", message);
            formData.append("pic", file[0]);
            formData.append('@Html.AntiForgeryTokenName', '@Html.AntiForgeryTokenValue');
            sendImage(toUserEmail, formData);
        } else {
            connection.invoke("SendMessage", toUserEmail, message)
                .then(function () {
                    var myMsgBubble = `<li class="message d-inline sent-message"><span class="d-inline received-message" style="font-size: 10px;"></span> Me: ${message}</li>`;
                    $("#messages").append(myMsgBubble);
                    $("#chatContainer").scrollTop($("#messages").height());
                    $("#messageInput").val("");
                })
                .catch(function (err) {
                    console.error(err.toString());
                });
        }
    }

    function setActiveChatRoom(chatRoom) {
        $(".chat-room").removeClass("active");
        $(".chat-room[data-chatroom='" + chatRoom + "']").addClass("active");
        activeChatRoom = chatRoom;
        $("#messageInput").val("");
        $(".chat-room").removeClass("new-message");

        var previousMessages = getChatRoomMessages(chatRoom);
        displayPreviousMessages(previousMessages);
        $("#chatContainer").scrollTop($("#messages").height());
    }

    function getChatRoomMessages(chatRoom) {
        var messages = [];
        if (chatRoom === "John") {
            messages.push({ sender: "John", content: "Hello there!" });
            messages.push({ sender: currentUsername, content: "Hi John! How are you?" });
            messages.push({ sender: "John", content: "I'm good. How about you?" });
        } else if (chatRoom === "Emily") {
            messages.push({ sender: "Emily", content: "Hey! What's up?" });
            messages.push({ sender: currentUsername, content: "Not much. Just chilling." });
        }
        return messages;
    }
    function displayPreviousMessages(messages) {
        messages.forEach(function (message) {
            var msgClass = message.sender === currentUsername ? "sent-message" : "received-message";
            var msgContent = message.isImage ? `<img src="${message.content}" class="image-message"/>` : message.content;
            var msgLabel = `<span class="msg-label">${message.sender}: ${msgContent}</span>`;
            var msgBubble = `<li class="message ${msgClass}">${msgLabel}</li>`;
            $("#messages").append(msgBubble);
        });
    }
    function createChatRoomIfNotExists(chatRoom) {
        if ($(".chat-room[data-chatroom='" + chatRoom + "']").length === 0) {
            var chatRoomItem = `
                <li class="chat-room bg-secondary list-group-item border-0" data-chatroom="${chatRoom}">
                    <span>${chatRoom}</span>
                </li>`;
            $("#chatRooms").append(chatRoomItem);
        }
    }
    $("button").on("click", function () {
        var toUser = activeChatRoom;
        var message = $("#messageInput").val();
        sendMessage(toUser, message);

        var myMsgBubble = `<li class="message d-inline sent-message"><span class="d-inline received-message" style="font-size: 10px;">to:${toUser}</span> Me: ${message}</li>`;
        var toUserMsgBubble = ``;
        $("#messages").append(toUserMsgBubble);
        $("#chatContainer").scrollTop($("#messages").height());
        let file = $("#Image-Upload").get(0).files;
        let formData = new FormData();
        formData.append("content", $("#messageInput").val());
        formData.append("pic", file[0]);
        formData.append('@Html.AntiForgeryTokenName', '@Html.AntiForgeryTokenValue');

        $.ajax({
            type: "POST",
            url: '/Upload/AddOrEdit',
            data: formData,
            processData: false,
            contentType: false,
            headers: { 'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val() },
            success: function (response, textStatus, xhr) {
                // Check if a file is selected before showing the SweetAlert
                if (file.length > 0) {
                    // Show SweetAlert for successful image upload
                    Swal.fire({
                        icon: 'success',
                        title: 'Image Uploaded',
                        text: 'Your image has been uploaded successfully!',
                        showConfirmButton: false,
                        timer: 2000, // Show for 2 seconds
                    });
                    $("#Image-Upload").val(""); // Clear the file input field
                }
            },
            error: function (xhr, textStatus, errorThrown) {
                console.error(xhr.status + ":" + errorThrown);
            }
        });
    });

    function getUserEmail(userEmail) {
        // Add logic to fetch the user's email address from your authentication system or elsewhere
        // Return the user's email address
        return "user@example.com"; // Replace with the actual user's email address
    }


    $("#addChatButton").click(function () {
        Swal.fire({
            title: "Enter user email:",
            input: "text",
            showCancelButton: true,
            confirmButtonText: "Add",
            cancelButtonText: "Cancel",
            allowOutsideClick: false,
            inputValidator: (value) => {
                if (!value || value.trim() === "") {
                    return "Please enter a valid user email";
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                var chatRoomEmail = result.value;
                createChatRoomIfNotExists(chatRoomEmail);
                setActiveChatRoom(chatRoomEmail); // Set the newly added user as the active chat room

                // Send a message to the new user
                connection.invoke("SendMessage", chatRoomEmail, "Hello, I added you!");
            }
        });
    });



    $(document).on("click", ".chat-room", function () {
        var chatRoom = $(this).data("chatroom");
        setActiveChatRoom(chatRoom);
    });

    connection.on("ReceiveMessage", function (fromUserEmail, toUserEmail, message, isImage, imageUrl) {
        console.log("Received message:", fromUserEmail, toUserEmail, message, isImage, imageUrl);

        if (isImage) {

            displayMessage(fromUserEmail, imageUrl, true, imageUrl);
        } else {

            displayMessage(fromUserEmail, message, false, null);
        }
    });

    connection.onreconnected(function () {
        var userEmail = getUserEmail();
        currentUsername = userEmail;
        $("#username").text("Logged in as: " + userEmail);

        // Rejoin the chat room after reconnection
        connection.invoke("JoinChat", userEmail)
            .then(function () {
                console.log("Rejoined chat after reconnection");
            })
            .catch(function (err) {
                console.error("Error rejoining chat: " + err.toString());
            });
    });
    connection.start()
        .then(function () {
            // Get the user's email from your authentication system
            currentUsername = getUserEmail(); // Replace this with your method to fetch the user's email
            $("#username").text(currentUsername); // Update the username in the sidebar
            connection.invoke("JoinChat", currentUsername);
        })

    connection.on("newMessage", function (message) {
        var msgBubble = `<li class="message received">${message.Content}</li>`;
        $("#messages").append(msgBubble);
        $("#chatContainer").scrollTop($("#messages").height());
    });


    // Add this code in your JavaScript file
    connection.on("UpdateUserList", function (usernames) {
        var userList = $("#connectedUsersList");
        userList.empty();
        usernames.forEach(function (username) {
            var listItem = $("<li>").text(username);
            userList.append(listItem);
        });
    });
    connection.on("UserLeftChat", function (username) {
        Swal.fire({
            icon: 'info',
            title: 'User Left Chat',
            text: username + ' has left the chat.',
            timer: 3000
        });
    });


    // Define the current user's email address when the user logs in or when their session starts.
    /* var currentUsername = "asad7878@gmail.com"; */// Replace with the actual user's email
    // Add this click event handler to your JavaScript file
    $(".user-profile").click(function () {
        var selectedUserEmail = $(this).data("useremail");
        if (selectedUserEmail) {
            // Clear existing messages
            $("#messages").empty();

            // Make an AJAX request to fetch previous messages
            $.ajax({
                type: "GET",
                url: `/api/userprofile/messages?selectedUserEmail=${selectedUserEmail}`,
                success: function (messages) {
                    // Handle the retrieved chat messages (messages) here
                    console.log("Messages:", messages);
                    console.log(`URL: /api/userprofile/messages?selectedUserEmail=${selectedUserEmail}`);

                    // Render the chat history in your chat interface
                    displayChatHistory(messages);
                },
                error: function (xhr, textStatus, errorThrown) {
                    console.error(xhr.status + ":" + errorThrown);
                }
            });
        } else {
            console.error("selectedUserEmail is empty or undefined.");
        }
    });
    function displayChatHistory(messages) {
        var messageContainer = $("#messages");
        messageContainer.empty(); // Clear existing messages

        messages.forEach(function (message) {
            var messageText = message.isImage ? `<img src="${message.content}" class="image-message" />` : message.content;
            var messageClass = message.sender === currentUsername ? 'sent' : 'received';
            var messageHtml = `<li class="message ${messageClass}">${messageText}</li>`;
            messageContainer.append(messageHtml);
        });

        messageContainer.scrollTop(messageContainer[0].scrollHeight);
    }

});