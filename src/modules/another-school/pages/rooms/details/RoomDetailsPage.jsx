import React, { useEffect, useState } from 'react';
import { arrayOf, shape } from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import RoomDetailsHeader from './RoomDetailsHeader.jsx';
import { useHistory, useLocation, useRouteMatch, useParams } from 'react-router-dom';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import client from '@client';
import { handleApiError } from 'kidcasa/util/errors';

import Feed from './feed.jsx';
import RoomsParents from './parents';
import RoomStudentsPage from './RoomStudentsPage.jsx';

const propTypes = {
  rooms: arrayOf(shape({})),
};

const RoomDetailsPage = props => {
  const { rooms, onRoomDelete } = props;

  const params = useParams();
  const location = useLocation(); // needed for room-dropdown.jsx, which is being replaced
  const history = useHistory(); // needed for room-dropdown.jsx, which is being replaced

  const [shouldRefresh, setShouldRefresh] = useState(false); // Legacy
  const [room, setRoom] = useState({});

  const match = useRouteMatch('/rooms/:roomId/');
  const roomId = match?.params?.roomId;

  useDocumentTitle(room?.name);

  useEffect(() => {
    // Fetch room if we're on a room detail page
    if (!roomId) return;

    client
      .roomById(roomId)
      .then(room => {
        setRoom(room);
      })
      .catch(err => {
        handleApiError(err);
      });
  }, [roomId]);

  return (
    <>
      <RoomDetailsHeader
        roomId={params.id}
        room={room}
        setRoom={props.setRoom}
        rooms={rooms}
        location={location}
        history={history}
        setShouldRefresh={setShouldRefresh}
        onRoomDelete={onRoomDelete}
      />
      <Switch>
        <Route
          path="/rooms/:id/feed"
          exact
          render={renderProps => (
            <Feed
              match={renderProps.match}
              room={room}
              setRoom={props.setRoom}
              rooms={props.rooms}
              school={props.school}
              prependToMemberExpression
            />
          )}
        />
        <Route
          path="/rooms/:id/parents"
          exact
          render={renderProps => (
            <RoomsParents
              match={renderProps.match}
              room={room}
              setRoom={props.setRoom}
              rooms={rooms}
              shouldRefresh={shouldRefresh}
              setShouldRefresh={setShouldRefresh}
            />
          )}
        />
        <Route path="/rooms/:id/students" exact render={props => <RoomStudentsPage roomId={roomId} />} />
      </Switch>
    </>
  );
};

RoomDetailsPage.propTypes = propTypes;
export default RoomDetailsPage;
