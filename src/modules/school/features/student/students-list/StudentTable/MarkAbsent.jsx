import React, { useState } from 'react';
import * as R from 'ramda';
import { shape, func, string, arrayOf, bool } from 'prop-types';
import { DESIGN, TertiaryButton } from '@brightwheel/casa';
import { markStudentAbsent, sortRooms } from '@kidcasa/students/students.data';
import { useSession } from '@kidcasa/session';
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
  onMarkedAbsent: func.isRequired, // ({ message: "Something happened" }) => ..., Passed to pushNotification
};

const MarkAbsent = props => {
  const { student, onMarkedAbsent } = props;

  const [isWorking, setWorking] = useState(false);
  const session = useSession();

  return (
    <TertiaryButton
      version="v2"
      icon="calendar-absence"
      isWorking={isWorking}
      onClick={() => {
        setWorking(true);

        const room = sortRooms(student.rooms)[0];
        const { school, user } = session;

        return markStudentAbsent({ school, user, student, room })
          .then(response => {
            onMarkedAbsent({ message: `${student.first_name} was marked absent` });
            analytics.track(studentsListEvents.MarkAbsent);
          })
          .catch(error => {
            // Grab the error messages from the error response or fallback to a generic one
            const message = R.compose(
              R.replace(/^This student/, student.first_name), // make the error messages more personal for some messages
              R.unless(R.is(String), () => `There was an error marking ${student.first_name} absent`), // pass strings through, or use this default
              R.pathOr(error, ['response', 'data', '_errors', 0, 'message'])
            )(error);

            onMarkedAbsent({ message, type: 'error' });
          })
          .finally(() => {
            setWorking(false);
          });
      }}
    >
      Mark absent
      <span css={DESIGN.visuallyHidden}>- {student.first_name}</span>
    </TertiaryButton>
  );
};

MarkAbsent.propTypes = propTypes;
export default MarkAbsent;
