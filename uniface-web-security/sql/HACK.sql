create table A_TABLE
(
 ID char(32) not null,
 A_VALUE char(100) null,
 primary key  (ID)
);

create table FORUM_POST
(
 ID char(32) not null,
 USER_ID char(32) null,
 POST_DATE_TIME datetime null,
 POST_TEXT varchar(8106) null,
 primary key  (ID)
);

create table OFORUM_POST
(
 ID char(32) not null,
 SEGM char(4) not null,
 DATA varchar(8154) null,
 primary key  (ID,SEGM)
);

create table SESSION_HIJACKS
(
 ID char(32) not null,
 DATE_TIME datetime null,
 COOKIES_STRING char(512) null,
 URL char(512) null,
 primary key  (ID)
);

create table STUDENTS
(
 ID char(32) not null,
 DOB date null,
 NAME char(200) null,
 primary key  (ID)
);
