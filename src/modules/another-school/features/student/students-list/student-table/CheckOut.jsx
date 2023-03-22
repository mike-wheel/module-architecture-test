import React, { useState } from 'react';
import * as R from 'ramda';
import { arrayOf, bool, func, shape, string } from 'prop-types';
import { DESIGN, SecondaryButton } from '@brightwheel/casa';
import { useSession } from '@kidcasa/session';
import { getCheckedInRooms, checkStudentOut } from '@kidcasa/students/students.data';
import analytics, { studentsListEvents } from 'kidcasa/util/analytics';

const propTypes = {
  student: shape({
    first_name: string.isRequired,
    object_id: string.isRequired,
    rooms: arrayOf(
      shape({
        object_id: string,
        name: string,
        is_default_room: bool,
        is_checked_in: bool,
        is_absent: bool,
      })
    ).isRequired,
  }).isRequired,
  onCheckOut: func.isRequired, // ({ message: "Something happened" }) => ..., Passed to pushNotification
};

const CheckOut = props => {
  const { student, onCheckOut } = props;

  const [isWorking, setWorking] = useState(false);
  const session = useSession();

  const rooms = getCheckedInRooms(student);
  const roomText = rooms.length === 1 ? rooms[0]?.name : `${rooms.length} rooms`;

  return (
    <SecondaryButton
      version="v2"
      icon={'arrow-left-outline'}
      isWorking={isWorking}
      isDisabled={isWorking}
      onClick={() => {
        setWorking(true);

        const { school, user } = session;

        return checkStudentOut({ school, user, student, rooms })
          .then(response => {
            onCheckOut({ message: `${student.first_name} has been checked out of ${roomText}` });

            analytics.track(studentsListEvents.CheckInOut, { state: 'out' });
          })
          .catch(error => {
            // Grab the error messages from the error response or fallback to a generic one
            const message = R.compose(
              R.replace(/^This student/, student.first_name), // make the error messages more personal for some messages
              R.unless(R.is(String), () => `There was a problem checking out ${student.first_name}`), // pass strings through, or use this default
              R.pathOr(error, ['response', 'data', '_errors', 0, 'message'])
            )(error);

            onCheckOut({ message, type: 'error' });
          })
          .finally(() => {
            setWorking(false);
          });
      }}
    >
      Check out
      <span css={DESIGN.visuallyHidden}>
        - {student.first_name} from {roomText}
      </span>
    </SecondaryButton>
  );
};

CheckOut.propTypes = propTypes;
export default CheckOut;
