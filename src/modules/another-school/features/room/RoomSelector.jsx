import React from 'react';
import { arrayOf, shape, string } from 'prop-types';
import { COLORS, SIZES, DropdownButton } from '@brightwheel/casa';
import { Link } from 'react-router-dom';
import css from '@emotion/css';
import { useHistory } from 'react-router-dom';

const roomShape = {
  object_id: string.isRequired,
  name: string.isRequired,
};

const propTypes = {
  room: shape(roomShape).isRequired,
  rooms: arrayOf(shape(roomShape)).isRequired,
};

export const RoomSelector = props => {
  const { room: selectedRoom, rooms } = props;

  const history = useHistory();

  const options = rooms.map(room => {
    const roomUrl = `/rooms/${room.object_id}/students`;

    return {
      id: room.object_id,
      name: (
        <Link
          to={roomUrl}
          css={css`
            display: block; // the Link should fill the option space
            padding: 1rem; // reintroduce the padding here
            color: ${COLORS.black}; // remove <a> styles
            letter-spacing: normal; // reset letter-spacing that is inherited from the heading

            &:hover {
              text-decoration: none; // remove <a> styles
            }
          `}
        >
          {room.name}
        </Link>
      ),
      styles: css`
        display: block; // no flex so the <span> and <a> can fill the space
        padding: 0; // remove padding so the whole thing is clickable

        > span {
          display: block; // the Link should fill the option space
          font-size: ${SIZES.md}; // reset font-size that is inherited from the heading
        }
      `,
      isSelected: room.object_id === selectedRoom.object_id,
      onSelect: roomId => {
        // onSelect is needed for keyboard navigation (the <Link> handles mouse interaction)
        history.push(roomUrl);
      },
    };
  });

  return (
    <DropdownButton
      label={selectedRoom.name || ''}
      variant="trasparent"
      options={options}
      dropdownTop={0}
      css={css`

        // fix the spacing leading to a weird focus outline 
        line-height: normal; 
        padding: 0;

        > div {
          padding: 0 0.5rem; // make spacing consistent to fix weird focus outline 
        }

        .dropdown-caret {
          border: 0; // remove the triangle drawn with css
          width: 2rem;
          height: 2rem;

          &::after {
            display: block;
            content: url('data:image/svg+xml,${encodeURIComponent(
              '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-down"><polyline points="6 9 12 15 18 9"></polyline></svg>'
            )}'); 
            font-size: 0; // remove extra whitespace contributing to weird focus outline
          }
        }
      `}
    />
  );
};

RoomSelector.propTypes = propTypes;
