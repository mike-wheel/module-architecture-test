import React, { useState } from 'react';
import * as R from 'ramda';
import { arrayOf, bool, func, shape, string } from 'prop-types';
import { COLORS, DESIGN, SIZES, DropdownButton, PopoverV2 } from '@brightwheel/casa';
import { css } from '@emotion/core';
import { sortRooms, getCheckedInRooms, moveStudentToRoom } from '@kidcasa/students/students.data';
import { useSession } from '@kidcasa/session';
import analytics, { studentsListEvents } from 'kidcasa/util/analytics';

const propTypes = {
  onSelect: func.isRequired,
  student: shape({
    first_name: string.isRequired,
    rooms: arrayOf(
      shape({
        object_id: string,
        name: string,
        is_default_room: bool,
        is_checked_in: bool,
      })
    ).isRequired,
  }).isRequired,
};

const MoveRoom = props => {
  const { onSelect, student } = props;

  const [isWorking, setWorking] = useState(false);
  const session = useSession();

  const options = R.compose(
    R.map(
      R.applySpec({
        id: R.prop('object_id'),
        name: room => {
          if (room.is_default_room) {
            return (
              <>
                {room.name}{' '}
                <span
                  css={css`
                    font-size: ${SIZES.sm};
                    color: ${COLORS.neutral.minersCoal};
                    padding-left: 0.5rem;
                  `}
                >
                  ({student.first_name}'s homeroom)
                </span>
              </>
            );
          }

          return room.name;
        },
        isSelected: R.prop('is_checked_in'),
        onSelect: room => {
          return () => {
            setWorking(true);

            const checkedInRooms = getCheckedInRooms(student);
            const { school, user } = session;

            return moveStudentToRoom({ school, user, student, checkedInRooms, moveToRoom: room })
              .then(() => {
                onSelect({ message: `${student.first_name} has been moved to ${room.name}` });
                analytics.track(studentsListEvents.MoveRoom, {
                  from_room: checkedInRooms[0].object_id,
                  to_room: room.object_id,
                });
              })
              .catch(error => {
                // Grab the error messages from the error response or fallback to a generic one
                const message = R.compose(
                  R.replace(/^This student/, student.first_name), // make the error messages more personal for some messages
                  R.unless(R.is(String), () => `There was an error moving ${student.first_name} to ${room.name}`), // pass strings through, or use this default
                  R.pathOr(error, ['response', 'data', '_errors', 0, 'message'])
                )(error);

                onSelect({ message, type: 'error' });
              })
              .finally(() => {
                setWorking(false);
              });
          };
        },
      })
    ),
    sortRooms,
    R.propOr([], 'rooms')
  )(student);

  const isDisabled = student.rooms.length <= 1;

  const MoveRoomDropdown = props => {
    return (
      <DropdownButton
        variant="transparent"
        css={css`

          color: ${COLORS.blurple.regular};

          > div > span {
            padding-right: 0.125rem; // the new caret has some padding built in
          }

          .dropdown-caret {
            border: 0; // remove the triangle drawn with css
            width: 1.5rem;
            height: 1.5rem;

            &::after {
              display: block;
              content: url('data:image/svg+xml,${encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="${COLORS.blurple.regular}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-down"><polyline points="6 9 12 15 18 9"></polyline></svg>`
              )}'); 
            }
          }
        `}
        options={options}
        label={
          <>
            Move room <span css={DESIGN.visuallyHidden}>- {student.first_name}</span>
          </>
        }
        isDisabled={isDisabled || isWorking}
        isWorking={isWorking}
        {...props}
      />
    );
  };

  return isDisabled ? (
    <PopoverV2 isTooltip position="bottom" trigger={<MoveRoomDropdown />}>
      Assign another room in the <br />
      student's profile to move rooms.
    </PopoverV2>
  ) : (
    <MoveRoomDropdown />
  );
};

MoveRoom.propTypes = propTypes;
export default MoveRoom;
