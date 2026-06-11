// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract BlockCred {
    address public owner;

    struct Certificate {
        string certId;
        string studentName;
        string degree;
        string pdfHash;
        bool revoked;
        uint256 issueDate;
    }

    mapping(string => Certificate) public certificates;
    mapping(string => string) public certificateHashes;

    event CertificateIssued(
        string certId,
        string studentName,
        string degree,
        uint256 issueDate,
        string pdfHash
    );

    event CertificateRevoked(string certId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function issueCertificateWithHash(
        string memory certId,
        string memory studentName,
        string memory degree,
        string memory pdfHash
    ) public onlyOwner {
        require(bytes(certId).length > 0, "Certificate ID is required");
        require(bytes(studentName).length > 0, "Student name is required");
        require(bytes(degree).length > 0, "Degree is required");
        require(bytes(pdfHash).length > 0, "PDF hash is required");
        require(
            bytes(certificates[certId].certId).length == 0,
            "Certificate already exists"
        );

        certificates[certId] = Certificate({
            certId: certId,
            studentName: studentName,
            degree: degree,
            pdfHash: pdfHash,
            revoked: false,
            issueDate: block.timestamp
        });

        certificateHashes[certId] = pdfHash;

        emit CertificateIssued(
            certId,
            studentName,
            degree,
            block.timestamp,
            pdfHash
        );
    }

    function revokeCertificate(string memory certId) public onlyOwner {
        require(bytes(certId).length > 0, "Certificate ID is required");
        require(
            bytes(certificates[certId].certId).length != 0,
            "Certificate does not exist"
        );
        require(!certificates[certId].revoked, "Certificate already revoked");

        certificates[certId].revoked = true;

        emit CertificateRevoked(certId);
    }

    function getCertificateHash(
        string memory certId
    ) public view returns (string memory) {
        return certificateHashes[certId];
    }

    function getCertificate(
        string memory certId
    )
        public
        view
        returns (
            string memory,
            string memory,
            string memory,
            string memory,
            bool,
            uint256
        )
    {
        Certificate memory cert = certificates[certId];

        return (
            cert.certId,
            cert.studentName,
            cert.degree,
            cert.pdfHash,
            cert.revoked,
            cert.issueDate
        );
    }
}