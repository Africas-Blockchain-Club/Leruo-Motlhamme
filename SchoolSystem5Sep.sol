// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract School {
    string public schoolName;

    constructor(string memory _name) {
        schoolName = _name;
    }

    function getSchoolName() public view returns (string memory) {
        return schoolName;
    }
}

contract StudentsSystem is School {

    uint256 id;

    struct StudentWtc {
        uint256 stduentId;
        string name;
        uint javaGrade;
    }

    struct StudentAbc {
        uint256 stduentId;
        string name;
        string level;
    }

    mapping(uint => StudentWtc) public studentsWtc;
    mapping(uint => StudentAbc) public studentsAbc;

    event StudentAdded(uint studentId, string studentName, string className);
    event StudentModifiedWtc(uint studentId, string studentName, uint javaGrade);
    event StudentModifiedAbc(uint studentId, string studentName, string proficiencyLevel);

    constructor(string memory _schoolName) School(_schoolName) {}

    // Method overloading for the seperate classes
    // WTC
    function addStudent(string calldata className, string calldata _name, uint _javaGrade) public {
        // require(keccak256(abi.encodePacked((className))) == keccak256(abi.encodePacked(("ABC"))), "Class not found!");
        require(keccak256(abi.encodePacked((className))) == keccak256(abi.encodePacked(("WTC"))), "Class not found!");
        id++;

        studentsWtc[id].stduentId = id;
        studentsWtc[id].name = _name;
        studentsWtc[id].javaGrade = _javaGrade;


        emit StudentAdded(id, _name, className);
    }

    // ABC
    function addStudent(string calldata className, string calldata _name, string calldata _level) public {
        require(keccak256(abi.encodePacked((className))) == keccak256(abi.encodePacked(("ABC"))), "Class not found!");
        // require(keccak256(abi.encodePacked((className))) == keccak256(abi.encodePacked(("WTC"))), "Class not found!");
        id++;
        
        studentsAbc[id].stduentId = id;
        studentsAbc[id].name = _name;
        studentsAbc[id].level = _level;

        id++;

        emit StudentAdded(id, _name, "ABC");
    }

    function getStudent(uint _id) public view returns (uint256 studentId, string memory name, string memory level, uint256 javaGrade) {
        require(studentsAbc[_id].stduentId != 0 || studentsWtc[_id].stduentId != 0, "Student not found!");

        if (studentsAbc[_id].stduentId != 0) {
            StudentAbc memory s = studentsAbc[_id];
            return (s.stduentId, s.name, s.level, 0);
        } else if (studentsWtc[_id].stduentId != 0) {
            StudentWtc memory s = studentsWtc[_id];
            return (s.stduentId, s.name, "", s.javaGrade);
        }

    }



    // Method overloading for modification 
    // WTC
    function modifyStudent(string calldata _school, uint _id, uint _newJavaGrade) public {
        require((keccak256(abi.encodePacked((_school))) == keccak256(abi.encodePacked(("WTC")))) || 
        (keccak256(abi.encodePacked((_school))) == keccak256(abi.encodePacked(("ABC")))), "Class not found!");

        StudentWtc storage currentStudent = studentsWtc[_id];
        currentStudent.javaGrade = _newJavaGrade;

        emit StudentModifiedWtc(_id, currentStudent.name, currentStudent.javaGrade);
    }

    // ABC
    function modifyStudent(string calldata _school, uint _id, string calldata _newLevel) public {
        require((keccak256(abi.encodePacked((_school))) == keccak256(abi.encodePacked(("WTC")))) || 
        (keccak256(abi.encodePacked((_school))) == keccak256(abi.encodePacked(("ABC")))), "Class not found!");

        StudentAbc storage currentStudent = studentsAbc[_id];
        currentStudent.level = _newLevel;

        emit StudentModifiedAbc(_id, currentStudent.name, currentStudent.level);
    }

}


contract AdminControl {
    address public admin;

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    function changeAdmin(address _newAdmin) public onlyAdmin {
        admin = _newAdmin;
    }
}


contract FullSchoolSystem is StudentsSystem, AdminControl {

    constructor(string memory _schoolName) StudentsSystem(_schoolName) AdminControl() {    
    }

}
