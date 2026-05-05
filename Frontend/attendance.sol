// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Smart Attendance System
 * @author Sanath
 * @notice Blockchain-based attendance using Ethereum
 * @dev Final Year Project – CSE
 */
contract AttendanceSystem {

    /*━━━━━━━━━━━━━━━━━━
        DATA MODELS
    ━━━━━━━━━━━━━━━━━━*/

    struct Attendance {
        bool marked;
        uint256 timestamp;
    }

    struct Session {
        uint256 sessionId;
        uint256 startTime;
        uint256 endTime;
        bool active;
    }

    /*━━━━━━━━━━━━━━━━━━
        STATE
    ━━━━━━━━━━━━━━━━━━*/

    address public immutable teacher;
    uint256 public sessionCount;

    mapping(uint256 => Session) public sessions;
    mapping(uint256 => mapping(address => Attendance)) private attendance;
    mapping(uint256 => address[]) private attendees;

    /*━━━━━━━━━━━━━━━━━━
        EVENTS
    ━━━━━━━━━━━━━━━━━━*/

    event SessionCreated(uint256 indexed sessionId, uint256 startTime);
    event SessionClosed(uint256 indexed sessionId, uint256 endTime);
    event AttendanceMarked(
        uint256 indexed sessionId,
        address indexed student,
        uint256 time
    );

    /*━━━━━━━━━━━━━━━━━━
        MODIFIERS
    ━━━━━━━━━━━━━━━━━━*/

    modifier onlyTeacher() {
        require(msg.sender == teacher, "Only teacher allowed");
        _;
    }

    modifier sessionActive(uint256 sessionId) {
        require(sessions[sessionId].active, "Session not active");
        _;
    }

    /*━━━━━━━━━━━━━━━━━━
        CONSTRUCTOR
    ━━━━━━━━━━━━━━━━━━*/

    constructor() {
        teacher = msg.sender;
    }

    /*━━━━━━━━━━━━━━━━━━
        TEACHER ACTIONS
    ━━━━━━━━━━━━━━━━━━*/

    function createSession() external onlyTeacher returns (uint256) {
        sessionCount++;

        sessions[sessionCount] = Session({
            sessionId: sessionCount,
            startTime: block.timestamp,
            endTime: 0,
            active: true
        });

        emit SessionCreated(sessionCount, block.timestamp);
        return sessionCount;
    }

    function closeSession(uint256 sessionId)
        external
        onlyTeacher
        sessionActive(sessionId)
    {
        sessions[sessionId].active = false;
        sessions[sessionId].endTime = block.timestamp;

        emit SessionClosed(sessionId, block.timestamp);
    }

    /*━━━━━━━━━━━━━━━━━━
        STUDENT ACTION
    ━━━━━━━━━━━━━━━━━━*/

    function markAttendance(uint256 sessionId)
        external
        sessionActive(sessionId)
    {
        require(
            !attendance[sessionId][msg.sender].marked,
            "Attendance already marked"
        );

        attendance[sessionId][msg.sender] = Attendance({
            marked: true,
            timestamp: block.timestamp
        });

        attendees[sessionId].push(msg.sender);

        emit AttendanceMarked(sessionId, msg.sender, block.timestamp);
    }

    /*━━━━━━━━━━━━━━━━━━
        VIEW FUNCTIONS
    ━━━━━━━━━━━━━━━━━━*/

    function getAttendance(
        uint256 sessionId,
        address student
    ) external view returns (bool, uint256) {
        Attendance memory a = attendance[sessionId][student];
        return (a.marked, a.timestamp);
    }

    function getAttendees(
        uint256 sessionId
    ) external view returns (address[] memory) {
        return attendees[sessionId];
    }
}
