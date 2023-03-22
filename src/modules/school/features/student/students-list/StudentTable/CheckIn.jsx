import React, { useReducer } from 'react';
import { arrayOf, bool, string, shape, func } from 'prop-types';
import FocusTrap from 'focus-trap-react';
import * as R from 'ramda';
import {
  COLORS,
  DESIGN,
  SIZES,
  ButtonGroup,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  PopoverV2,
  PrimaryButton,
  RadioButtonGroupV2,
  SecondaryButton,
} from '@brightwheel/casa';
import StudentPill from './StudentPill.jsx';
import { css } from '@emotion/core';
import { checkStudentIn, sortRooms } from '@kidcasa/students/students.data.js';
import { useSession } from '@kidcasa/session';
import analytics, { studentsListEvents } from 'kidcasa/util/analytics';

const propTypes = {
  student: shape({
    object_id: string,
    first_name: string,
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
  onCheckIn: func.isRequired, // ({ message: "Something happened" }) => ..., Passed to pushNotification
};

const initialState = {
  isModalOpen: false,
  isWorking: false,
  selectedRoomId: null,
};

const handlers = {
  'open-modal': (state, action) => ({ ...state, isModalOpen: true }),
  'close-modal': (state, action) => ({ ...state, isModalOpen: false }),
  'select-room': (state, action) => ({ ...state, selectedRoomId: action.roomId }),
  'check-in-start': (state, action) => ({ ...state, isWorking: true }),
  'check-in-resolved': (state, action) => initialState,
};

const reducer = (state, action) => {
  const handler = handlers[action.type];
  return handler ? handler(state, action) : state;
};

const CheckIn = props => {
  const { student, onCheckIn } = props;

  const [state, dispatch] = useReducer(reducer, initialState);
  const { isModalOpen, isWorking, selectedRoomId } = state;

  const session = useSession();

  const sortedRooms = R.compose(sortRooms, R.propOr([], 'rooms'))(student);

  const roomsOptions = R.map(
    R.applySpec({
      id: R.prop('object_id'),
      value: R.prop('object_id'),
      label: room => {
        if (room.is_default_room) {
          return (
            <>
              {room.name}{' '}
              <span
                css={css`
                  font-size: ${SIZES.sm};
                  color: ${COLORS.neutral.minersCoal};
                `}
              >
                ({student.first_name}'s homeroom)
              </span>
            </>
          );
        }

        return room.name;
      },
    })
  )(sortedRooms);

  const handleCheckIn = ({ student, room }) => {
    dispatch({ type: 'check-in-start' });

    const { school, user } = session;

    return checkStudentIn({ school, user, student, room })
      .then(response => {
        onCheckIn({ message: `${student.first_name} was checked in to ${room.name}` });
        analytics.track(studentsListEvents.CheckInOut, { state: 'in' });
      })
      .catch(error => {
        // Grab the error messages from the error response or fallback to a generic one
        const message = R.compose(
          R.replace(/^This student/, student.first_name), // make the error messages more personal for some messages
          R.unless(R.is(String), () => `There was a problem checking ${student.first_name} in to ${room.name}`), // pass strings through, or use this default
          R.pathOr(error, ['response', 'data', '_errors', 0, 'message'])
        )(error);

        onCheckIn({ message, type: 'error' });
      })
      .finally(() => {
        dispatch({ type: 'check-in-resolved' });
      });
  };

  const checkInButton = (
    <SecondaryButton
      version="v2"
      icon="check-circle-outline"
      isFullWidth
      isDisabled={sortedRooms.length === 0 || isWorking}
      isWorking={isWorking}
      onClick={() => {
        if (sortedRooms.length === 1) {
          handleCheckIn({ student, room: sortedRooms[0] });
        } else if (sortedRooms.length > 1) {
          dispatch({ type: 'open-modal' });
        } else {
          // this shouldn't happen because of `isDisabled` above
          console.error('no rooms!', student);
        }
      }}
    >
      Check in
      <span css={DESIGN.visuallyHidden}>
        {' '}
        - {student.first_name}
        {sortedRooms.length === 1 ? ` to ${sortedRooms[0].name}` : null}
      </span>
    </SecondaryButton>
  );

  return (
    <>
      {isModalOpen ? (
        <FocusTrap>
          <Modal closeModal={() => dispatch({ type: 'close-modal' })} data-testid="check-in-modal">
            <ModalHeader>
              <div
                css={css`
                  display: flex;
                  align-items: center;
                `}
              >
                <span
                  css={css`
                    margin-right: auto;
                  `}
                >
                  Check in
                </span>
                <StudentPill student={student} />
              </div>
            </ModalHeader>
            <form
              onSubmit={e => {
                e.preventDefault();

                handleCheckIn({
                  student: student,
                  room: sortedRooms.find(room => room.object_id === selectedRoomId),
                });
              }}
            >
              <ModalBody>
                <div
                  css={css`
                    // hack so the inputs stack
                    fieldset {
                      display: block;
                    }

                    label {
                      display: block;
                      margin-bottom: 0.5rem;
                    }
                  `}
                >
                  Select a room to check {student.first_name} in to:
                  <RadioButtonGroupV2
                    options={roomsOptions}
                    label={`Select a room to check ${student.first_name} in to.`}
                    name="room"
                    value={selectedRoomId || ''} // TODO update RadioButtonGroupV2 proptypes to accept null for value to be null
                    onChange={(name, value) => {
                      dispatch({ type: 'select-room', roomId: value });
                    }}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <ButtonGroup>
                  <SecondaryButton onClick={() => dispatch({ type: 'close-modal' })}>Cancel</SecondaryButton>
                  <PrimaryButton type="submit" isWorking={isWorking} isDisabled={!selectedRoomId || isWorking}>
                    Check in
                  </PrimaryButton>
                </ButtonGroup>
              </ModalFooter>
            </form>
          </Modal>
        </FocusTrap>
      ) : null}

      {sortedRooms.length === 0 ? (
        <PopoverV2
          isTooltip
          position="bottom-end"
          trigger={checkInButton}
          css={css`
            display: block; // override inline-flex, to prevent squishing the button
          `}
        >
          This student needs to be assigned a room.
        </PopoverV2>
      ) : (
        checkInButton
      )}
    </>
  );
};

CheckIn.propTypes = propTypes;
export default CheckIn;
