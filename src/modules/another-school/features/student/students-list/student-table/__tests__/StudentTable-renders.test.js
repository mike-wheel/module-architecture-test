import * as R from 'ramda';
import { screen } from '@testing-library/react';
import { renderWithStudent, homeroom, room1 } from './StudentTable.mocks.js';

import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// https://jestjs.io/docs/expect#expectextendmatchers
expect.extend({
  /**
   * toMaybeExist - used in checkActions below
   * @param {Element | null} received An element from queryBy, which will return null if not found
   * @param {String} key The name of the element, used in the failure message
   * @param {Boolean} shouldExist whether or not this element should exist in the DOM
   * @returns
   */
  toMaybeExist: (received, key, shouldExist) => {
    if (shouldExist && R.isNil(received)) {
      return { message: () => `'${key}' not found!`, pass: false };
    }

    if (!shouldExist && !R.isNil(received)) {
      return { message: () => `'${key}' should not be there!`, pass: false };
    }

    return { pass: true };
  },
});

/**
 *
 * @param {Array<String>} actions An array of element keys of the actions that should be in the DOM
 * @returns elements map so the consumer can run any addition assertions:
 *   eg, expect(elements['Move room']).toBeDisabled();
 */
const checkActions = actions => {
  const elements = {
    'Check in': screen.queryByRole('button', { name: /Check in.*/ }),
    'Check out': screen.queryByRole('button', { name: /Check out.*/ }),
    'Move room': screen.queryByRole('button', { name: /Move room.*/ }),
    'Mark absent': screen.queryByRole('button', { name: /Mark absent.*/ }),
  };

  Object.keys(elements).forEach(key => {
    expect(elements[key]).toMaybeExist(key, actions.includes(key));
  });

  return elements;
};

// see https://react-drwr1j.stackblitz.io/ for a scenerio matrix
describe('StudentTable', () => {
  it('should not have any accessibility violations', async () => {
    const { container } = renderWithStudent({});
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it("should render the student's homeroom first", () => {
    renderWithStudent({ rooms: [room1(), homeroom()] });

    // https://stackoverflow.com/questions/71352053/how-do-i-use-jest-to-test-that-one-text-element-comes-before-another
    const html = document.body.innerHTML;
    const homeroomTextLocation = html.search('Homeroom');
    const room1TextLocation = html.search('Room 1');

    expect(homeroomTextLocation).toBeLessThan(room1TextLocation);
  });

  it('should disable the check in button if the student has no rooms', () => {
    renderWithStudent({ rooms: [] }); // << no rooms

    const checkInButton = screen.getByRole('button', { name: /Check in/i });

    expect(checkInButton).toBeDisabled();
  });
});

describe('Assigned a single homeroom', () => {
  it('should show correct actions when not checked nor absent', async () => {
    renderWithStudent({ rooms: [homeroom()] });

    checkActions(['Check in', 'Mark absent']);
  });

  it('should show correct actions when absent ', async () => {
    renderWithStudent({ rooms: [homeroom(['absent'])] });

    checkActions(['Check in']);
  });

  it('should show correct actions when checked in', async () => {
    renderWithStudent({ rooms: [homeroom(['checked in'])] });

    const elements = checkActions(['Check out', 'Move room']);
    expect(elements['Move room']).toBeDisabled();
  });

  it('should show correct actions when checked and absent', async () => {
    renderWithStudent({ rooms: [homeroom(['checked in', 'absent'])] });

    const elements = checkActions(['Check out', 'Move room']);
    expect(elements['Move room']).toBeDisabled();
  });
});

describe('Assigned to multiple rooms', () => {
  it('should show correct actions when not checked nor absent', async () => {
    renderWithStudent({ rooms: [homeroom(), room1()] });

    checkActions(['Check in', 'Mark absent']);
  });

  it('should show correct actions when absent from homeroom', async () => {
    renderWithStudent({ rooms: [homeroom(['absent']), room1()] });

    checkActions(['Check in']);
  });

  it('should show correct actions when absent from room1', async () => {
    renderWithStudent({ rooms: [homeroom(), room1(['absent'])] });

    checkActions(['Check in']);
  });

  it('should show correct actions when absent from both', async () => {
    renderWithStudent({ rooms: [homeroom(['absent']), room1(['absent'])] });

    checkActions(['Check in']);
  });

  it('should show correct actions when checked in to homeroom', async () => {
    renderWithStudent({ rooms: [homeroom(['checked in']), room1()] });

    checkActions(['Check out', 'Move room']);
  });

  it('should show correct actions when checked in and absent from homeroom', async () => {
    renderWithStudent({ rooms: [homeroom(['checked in', 'absent']), room1()] });

    checkActions(['Check out', 'Move room']);
  });
});
