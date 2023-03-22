import cx from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';

import client from '../../client';
import ErrorAlert from '../../components/error-alert';
import PopoverComp from '../../components/features/popover';
import CreateStudent from '../create-student';
import RoomSettingsDialog from '../RoomSettingsDialog';
import OtherStudentSelect from '../other-student-select';
import { TertiaryButton, PopoverV2 } from '@brightwheel/casa';
import analytics, { events, page } from '../../util/analytics';
import { ButtonColors } from '../../components/element/button';
import { handleApiError } from '../../util/errors';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { PageAction } from '../../components/PageAction/PageAction';
import { RoomsFeedTab } from '../rooms-nav/RoomsFeedTab';
import DeleteRoomModal from '../delete-room-modal';
import { RoomSelector } from './RoomSelector.jsx';

import css from '../show.module.scss';

// this is a copy of FeedParentsStudentsNav to use when feature web_attendance_phase1_rooms_page is enabled
class RoomDetailsHeader extends React.Component {
  constructor(props) {
    super(props);

    this.roomNameInputRef = React.createRef();

    this.state = {
      isAddingStudent: false,
      isCreatingStudent: false,
      shouldClosePopover: false,
      isSubmittingNewStudent: false,
      showDeleteModal: false,
    };
  }

  closePopover = () => {
    this.setState({ shouldClosePopover: false });
  };

  toggleIsCreatingStudent = () => {
    const { isCreatingStudent } = this.state;
    this.setState({ isCreatingStudent: !isCreatingStudent });
  };

  handleUpdateFormSubmit = attrs => {
    const { rooms, roomId, setRoom } = this.props;
    client.updateRoom(roomId, attrs).then(room => {
      analytics.track(events.update_room, { room_name_after: attrs.name });

      // Update rooms array so room dropdown shows new name
      const index = rooms.findIndex(r => r.object_id === room.object_id);
      if (index !== -1) {
        rooms.splice(index, 1, room);
      }

      this.setState({ shouldClosePopover: true });
      setRoom(room);
    });
  };

  handleAddStudent = option => {
    const { roomId, setShouldRefresh } = this.props;

    if (option && option.object_id) {
      this.setState({ isAddingStudent: true });
      client
        .addStudentToRoom(option.object_id, roomId)
        .then(() => {
          analytics.track(events.add_student_to_room, { label: 'room_manage_students' });

          this.setState({ isAddingStudent: false, shouldClosePopover: true });
          setShouldRefresh(true);
        })
        .catch(err => {
          this.setState({ isAddingStudent: false });

          handleApiError(err);
        });
    }
  };

  handleCreateStudent = model => {
    const { roomId, setShouldRefresh } = this.props;

    model.first_name = model.first_name.trim();

    if (model.last_name) {
      model.last_name = model.last_name.trim();
    }

    this.setState({ isSubmittingNewStudent: true });

    return client
      .createStudentForSchool(model)
      .then(student => {
        analytics.track(events.add_student, { label: 'room_manage_students' });

        client
          .addStudentToRoom(student.object_id, roomId)
          .then(() => {
            analytics.track(events.add_student_to_room, { label: 'room_manage_students' });

            // resetForm('rooms/newStudent');

            this.setState({ shouldClosePopover: true, isSubmittingNewStudent: false });
            setShouldRefresh(true);
          })
          .catch(err => {
            // Close popover as a resubmission to create a student will result in a failed student creation call since that step has succeeded
            this.setState({ shouldClosePopover: true, isSubmittingNewStudent: false });

            handleApiError(err);
          });
      })
      .catch(err => {
        this.setState({ isSubmittingNewStudent: false });

        handleApiError(err);
      });
  };

  handleDelete = () => {
    const { onRoomDelete } = this.props;

    this.setState({ isDeleting: true });

    return client
      .deleteRoom(this.props.roomId)
      .then(() => {
        analytics.track(events.delete_room);
        // this.setState({
        //   isRequestingDelete: false,
        //   isDeleting: false,
        //   isUpdatingRooms: true,
        //   room: {},
        // });
        onRoomDelete();
      })
      .catch(response => {
        if (response && response.reason && response.reason.status === 403) {
          this.setState({ roomDeletionForbidden: true });
          setTimeout(() => {
            this.setState({ roomDeletionForbidden: false });
          }, 3000);
        }
      })
      .finally(() => {
        this.setState({ isDeleting: false });
      });
  };

  render() {
    const { room, rooms, roomId, roomDeletionForbidden } = this.props;
    const { isAddingStudent, isCreatingStudent, shouldClosePopover, isSubmittingNewStudent, isDeleting } = this.state;
    const ROUTES = [
      {
        path: `/rooms/${roomId}/students`,
        trackEvent: () => {
          analytics.page(page.room_students);
        },
        tab: 'Students',
      },
      {
        path: `/rooms/${roomId}/parents`,
        trackEvent: () => {
          analytics.page(page.room_parents);
        },
        tab: 'Parents',
      },
      {
        path: `/rooms/${roomId}/feed`,
        trackEvent: () => {
          analytics.page(page.room_feed);
        },
        tab: 'Feed',
      },
    ];

    return (
      <React.Fragment>
        <PageHeader
          backButton={
            <TertiaryButton size="md" icon="chevron-left" version="v2" href="/rooms/list">
              Back to room list
            </TertiaryButton>
          }
          actions={
            <>
              <PopoverV2
                position="bottom"
                trigger={
                  <TertiaryButton
                    size="md"
                    icon="settings"
                    version="v2"
                    onClick={() => {
                      // focus the Room name input when the user opens the dialog
                      if (this.roomNameInputRef.current) {
                        this.roomNameInputRef.current.focus();
                      }
                    }}
                  >
                    Room settings
                  </TertiaryButton>
                }
              >
                {closePopover => (
                  <RoomSettingsDialog
                    key={room.object_id} // re-render this component if the room changes
                    onRequestDelete={() => {
                      this.setState({ showDeleteModal: true });
                      closePopover();
                    }}
                    onUpdateFormSubmit={attrs => {
                      this.handleUpdateFormSubmit(attrs);
                      closePopover();
                    }}
                    isDeleting={isDeleting}
                    inputRef={this.roomNameInputRef}
                    room={room}
                  />
                )}
              </PopoverV2>

              <PageAction
                as={PopoverComp}
                key="add-student"
                className={cx(css.popover, 'hidden-print')}
                caret
                padded
                align="bottom"
                triggerClassName={cx(css.trigger, css.largeTrigger)}
                triggerSize="medium"
                triggerColor={ButtonColors.blue}
                trigger={<div data-testid="addStudentButton">Add Student</div>}
                shouldClose={shouldClosePopover}
                handlePopoverClose={this.closePopover}
                popoverClassName={css.popoverCaret}
                size="medium"
                content={
                  <div className={css.addStudentPopoverContent}>
                    <div className={css.addStudentTabs}>
                      <RoomsFeedTab isActive={isCreatingStudent} onClick={this.toggleIsCreatingStudent}>
                        Current
                      </RoomsFeedTab>
                      <RoomsFeedTab isActive={!isCreatingStudent} onClick={this.toggleIsCreatingStudent}>
                        New
                      </RoomsFeedTab>
                    </div>
                    {isCreatingStudent ? (
                      <OtherStudentSelect
                        isLoading={isAddingStudent}
                        disabled={isAddingStudent}
                        onChange={this.handleAddStudent}
                        className={css.other}
                      />
                    ) : (
                      <div>
                        <CreateStudent onSubmit={this.handleCreateStudent} isSubmitting={isSubmittingNewStudent} />
                      </div>
                    )}
                  </div>
                }
              />
            </>
          }
          routes={ROUTES}
        >
          <RoomSelector rooms={rooms} room={room} />
        </PageHeader>
        {roomDeletionForbidden && (
          <ErrorAlert message="This room has students. You cannot delete a room that has students assigned." />
        )}

        <DeleteRoomModal
          room={room}
          onHide={() => this.setState({ showDeleteModal: false })}
          onDelete={this.handleDelete}
          isShowing={this.state.showDeleteModal}
          isDeleting={isDeleting}
        />
      </React.Fragment>
    );
  }
}

const { bool, array, object, func, string } = PropTypes;
RoomDetailsHeader.propTypes = {
  room: object,
  rooms: array,
  roomId: string.isRequired,
  setRoom: func.isRequired,
  onRoomDelete: func,
  setShouldRefresh: func.isRequired,
  roomDeletionForbidden: bool,
};

export default RoomDetailsHeader;
