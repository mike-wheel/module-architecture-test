import React, { useCallback, useEffect, useState } from "react";
import { func, shape } from "prop-types";
import { Route, Switch, Redirect } from "react-router-dom";

import client from "@client";
import RoomsList from "kidcasa/rooms/rooms-list";
import RoomsSchedule from "kidcasa/rooms/schedule";
import RoomsMobileSchedule from "kidcasa/rooms/schedule/mview/schedule/components/mobile-schedule";
import { handleApiError } from "kidcasa/util/errors";
import { subscriptionShape } from "kidcasa/shared/proptype-shapes";
import { getCurrentUserId } from "kidcasa/shared/helpers/user-helpers";

import RoomDetailsPage from "./RoomDetailsPage/RoomDetailsPage.jsx";

const propTypes = {
  subscription: shape(subscriptionShape),
  history: shape({
    push: func,
  }),
};

const RoomsPage = (props) => {
  const { subscription, history } = props;
  const [room, setRoom] = useState({});
  const [rooms, setRooms] = useState([]);
  const [school, setSchool] = useState({});
  const [isPageLoading, setPageLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState();

  const fetchRooms = useCallback(() => {
    setPageLoading(true);

    client
      .roomsBySchool()
      .then((response) => {
        const rooms = response.rooms.filter((r) => !r.is_archive_ready);
        setRooms(rooms);
      })
      .catch((err) => {
        handleApiError(err);
      })
      .finally(() => {
        setPageLoading(false);
      });
  }, []);

  useEffect(() => {
    // Fetch rooms list on mount
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    // Fetch school on mount
    client
      .schoolById()
      .then((school) => setSchool(school))
      .catch((err) => {
        handleApiError(err);
      });
  }, []);

  useEffect(() => {
    // fetch current user on mount
    client
      .getSchoolUser(getCurrentUserId())
      .then((user) => {
        setCurrentUser(user);
      })
      .catch((err) => {
        handleApiError(err);
      });
  }, []);

  const listCheckProps = {
    // room: room, this isn't used in any of the listCheckProps pages
    rooms: rooms,
    school: school,
    updateRooms: fetchRooms,
    subscription: subscription,
    isPageLoading: isPageLoading,
    // isUpdatingRooms: isUpdatingRooms, this is covered by isPageLoading
    // currentUser,  passed only to the components that use it
  };

  const handleRoomDelete = useCallback(() => {
    setRooms([]); // clear the room list first so it doesn't contain the room that was just deleted
    fetchRooms();
    history.push("/rooms/list");
  }, [history, fetchRooms]);

  return (
    <Switch>
      <Redirect exact from="/rooms" to="/rooms/list" />
      <Redirect exact from="/rooms/check" to="/reports/room-check" />
      <Route
        path="/rooms/list"
        exact
        render={() => <RoomsList {...listCheckProps} />}
      />
      <Route
        path="/rooms/schedule"
        render={() => (
          <RoomsSchedule {...listCheckProps} currentUser={currentUser} />
        )}
      />
      {/* Mobile Schedule view */}
      <Route
        path="/rooms/mview/schedule"
        render={() => (
          <RoomsMobileSchedule {...listCheckProps} currentUser={currentUser} />
        )}
      />

      <Route
        path="/rooms/:id"
        render={(props) => (
          <RoomDetailsPage
            room={room}
            setRoom={setRoom}
            rooms={rooms}
            school={school}
            onRoomDelete={handleRoomDelete}
          />
        )}
      />
    </Switch>
  );
};

RoomsPage.propTypes = propTypes;
export default RoomsPage;
