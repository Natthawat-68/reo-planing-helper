CREATE TABLE audit_logs (
	id INTEGER NOT NULL, 
	at BIGINT NOT NULL, 
	action VARCHAR(64) NOT NULL, 
	by_username VARCHAR(64), 
	project_id VARCHAR(64), 
	project_title VARCHAR(500), 
	org_id VARCHAR(64), 
	details TEXT, 
	PRIMARY KEY (id)
);
CREATE TABLE orgs (
	id VARCHAR(64) NOT NULL, 
	name VARCHAR(500) NOT NULL, 
	active BOOLEAN NOT NULL, 
	pin VARCHAR(6) NOT NULL, 
	PRIMARY KEY (id)
);
INSERT INTO "orgs" VALUES('org-001','สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน',1,'693771');
INSERT INTO "orgs" VALUES('org-002','สพป.นม.1',1,'507482');
INSERT INTO "orgs" VALUES('org-003','สพป.นม.2',1,'994050');
INSERT INTO "orgs" VALUES('org-004','สพป.นม.3',1,'759238');
INSERT INTO "orgs" VALUES('org-005','สพป.นม.4',1,'710091');
INSERT INTO "orgs" VALUES('org-006','สพป.นม.5',1,'398250');
INSERT INTO "orgs" VALUES('org-007','สพป.นม.6',1,'956766');
INSERT INTO "orgs" VALUES('org-008','สพป.นม.7',1,'247370');
INSERT INTO "orgs" VALUES('org-009','สพป.นม.',1,'135967');
INSERT INTO "orgs" VALUES('org-010','ศูนย์การศึกษาพิเศษ เขตการศึกษา 11 จังหวัดนครราชสีมา',1,'196599');
INSERT INTO "orgs" VALUES('org-011','โรงเรียนนครราชสีมาปัญญานุกูล',1,'869540');
INSERT INTO "orgs" VALUES('org-012','สำนักงานอาชีวศึกษาจังหวัดนครราชสีมา',1,'146407');
INSERT INTO "orgs" VALUES('org-013','สำนักงานคณะกรรมการส่งเสริมการศึกษาเอกชน',1,'833838');
INSERT INTO "orgs" VALUES('org-014','สำนักงานส่งเสริมการเรียนรู้จังหวัดนครราชสีมา',1,'233473');
INSERT INTO "orgs" VALUES('org-015','สำนักงานส่งเสริมการปกครองท้องถิ่นจังหวัดนครราชสีมา',1,'985090');
INSERT INTO "orgs" VALUES('org-016','สำนักงานพระพุทธศาสนาจังหวัดนครราชสีมา',1,'510059');
INSERT INTO "orgs" VALUES('org-017','วิทยาลัยนาฏศิลปนครราชสีมา',1,'914777');
INSERT INTO "orgs" VALUES('org-018','กระทรวงอุดมศึกษา วิทยาศาสตร์ วิจัย และนวัตกรรม',1,'525352');
INSERT INTO "orgs" VALUES('org-019','โรงเรียนสาธิตมหาวิทยาลัยราชภัฏนครราชสีมา',1,'944757');
INSERT INTO "orgs" VALUES('org-020','โรงเรียนสุรวิวัฒน์ มหาวิทยาลัยเทคโนโลยีสุรนารี',1,'511923');
INSERT INTO "orgs" VALUES('org-021','มหาวิทยาลัยเทคโนโลยีสุรนารี',1,'399687');
INSERT INTO "orgs" VALUES('org-022','มหาวิทยาลัยเทคโนโลยีราชมงคลอีสาน',1,'510083');
INSERT INTO "orgs" VALUES('org-023','มหาวิทยาลัยราชภัฏนครราชสีมา',1,'536051');
INSERT INTO "orgs" VALUES('org-024','มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย วิทยาเขตนครราชสีมา',1,'729880');
INSERT INTO "orgs" VALUES('org-025','วิทยาลัยศาสนศาสตร์นครราชสีมา มหาวิทยาลัยมหามกุฏราชวิทยาลัย',1,'616580');
INSERT INTO "orgs" VALUES('org-026','มหาวิทยาลัยรามคำแหง สาขาวิทยบริการเฉลิมพระเกียรตินครราชสีมา',1,'283480');
INSERT INTO "orgs" VALUES('org-027','สถาบันบัณฑิตพัฒนบริหารศาสตร์ คณะรัฐประศาสนศาสตร์ ฯ',1,'454792');
INSERT INTO "orgs" VALUES('org-028','มหาวิทยาลัยวงษ์ชวลิตกุล',1,'205269');
INSERT INTO "orgs" VALUES('org-029','วิทยาลัยนครราชสีมา',1,'412304');
INSERT INTO "orgs" VALUES('org-030','วิทยาลัยเทคโนโลยีพนมวันท์',1,'366446');
INSERT INTO "orgs" VALUES('org-031','วิทยาลัยพยาบาลบรมราชชนนีนครราชสีมา',1,'590784');
INSERT INTO "orgs" VALUES('org-032','สำนักงานพัฒนาสังคมและความมั่นคงของมนุษย์จังหวัดนครราชสีมา',1,'881799');
INSERT INTO "orgs" VALUES('org-033','สำนักงานสาธารณสุขจังหวัดนครราชสีมา',1,'127865');
INSERT INTO "orgs" VALUES('org-034','สำนักงานสถิติจังหวัดนครราชสีมา',1,'337683');
INSERT INTO "orgs" VALUES('org-035','สำนักงานศึกษาธิการจังหวัดนครราชสีมา',1,'231212');
CREATE TABLE project_images (
	id VARCHAR(64) NOT NULL, 
	project_id VARCHAR(64) NOT NULL, 
	name VARCHAR(255), 
	data_url TEXT NOT NULL, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(project_id) REFERENCES projects (id) ON DELETE CASCADE
);
CREATE TABLE projects (
	id VARCHAR(64) NOT NULL, 
	org_id VARCHAR(64) NOT NULL, 
	title VARCHAR(500) NOT NULL, 
	budget FLOAT, 
	objective TEXT, 
	policy TEXT, 
	owner VARCHAR(255), 
	year INTEGER, 
	start_date DATE, 
	end_date DATE, 
	sdg JSON, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	updated_by VARCHAR(64), 
	PRIMARY KEY (id), 
	FOREIGN KEY(org_id) REFERENCES orgs (id)
);
INSERT INTO "projects" VALUES('p-1','org-023','โครงการพัฒนาทักษะดิจิทัลสำหรับครู',250000.0,'','','ผู้รับผิดชอบ',2569,'2026-03-16','2026-09-12','["4.4", "4.c"]','2026-03-16 17:14:06.755373','2026-03-25 17:14:06.755373','admin');
INSERT INTO "projects" VALUES('p-2','org-002','โครงการส่งเสริมการอ่านออกเขียนได้',180000.0,'','','ผู้รับผิดชอบ',2569,'2026-03-17','2026-09-13','["4.1", "4.6"]','2026-03-17 17:14:06.755373','2026-03-25 17:14:06.755373','mgr-org-002');
INSERT INTO "projects" VALUES('p-3','org-012','โครงการพัฒนาทักษะอาชีพ',280000.0,'','','ผู้รับผิดชอบ',2569,'2026-03-18','2026-09-14','["4.4"]','2026-03-18 17:14:06.755373','2026-03-25 17:14:06.755373','mgr-org-012');
CREATE TABLE users (
	id VARCHAR(64) NOT NULL, 
	username VARCHAR(64) NOT NULL, 
	password VARCHAR(64) NOT NULL, 
	role VARCHAR(32) NOT NULL, 
	org_id VARCHAR(64), 
	active BOOLEAN NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (username), 
	FOREIGN KEY(org_id) REFERENCES orgs (id)
);
INSERT INTO "users" VALUES('u-admin','admin','100238','admin',NULL,1);
INSERT INTO "users" VALUES('u-mgr-org-001','mgr-org-001','693771','manager','org-001',1);
INSERT INTO "users" VALUES('u-mgr-org-002','mgr-org-002','507482','manager','org-002',1);
INSERT INTO "users" VALUES('u-mgr-org-003','mgr-org-003','994050','manager','org-003',1);
INSERT INTO "users" VALUES('u-mgr-org-004','mgr-org-004','759238','manager','org-004',1);
INSERT INTO "users" VALUES('u-mgr-org-005','mgr-org-005','710091','manager','org-005',1);
INSERT INTO "users" VALUES('u-mgr-org-006','mgr-org-006','398250','manager','org-006',1);
INSERT INTO "users" VALUES('u-mgr-org-007','mgr-org-007','956766','manager','org-007',1);
INSERT INTO "users" VALUES('u-mgr-org-008','mgr-org-008','247370','manager','org-008',1);
INSERT INTO "users" VALUES('u-mgr-org-009','mgr-org-009','135967','manager','org-009',1);
INSERT INTO "users" VALUES('u-mgr-org-010','mgr-org-010','196599','manager','org-010',1);
INSERT INTO "users" VALUES('u-mgr-org-011','mgr-org-011','869540','manager','org-011',1);
INSERT INTO "users" VALUES('u-mgr-org-012','mgr-org-012','146407','manager','org-012',1);
INSERT INTO "users" VALUES('u-mgr-org-013','mgr-org-013','833838','manager','org-013',1);
INSERT INTO "users" VALUES('u-mgr-org-014','mgr-org-014','233473','manager','org-014',1);
INSERT INTO "users" VALUES('u-mgr-org-015','mgr-org-015','985090','manager','org-015',1);
INSERT INTO "users" VALUES('u-mgr-org-016','mgr-org-016','510059','manager','org-016',1);
INSERT INTO "users" VALUES('u-mgr-org-017','mgr-org-017','914777','manager','org-017',1);
INSERT INTO "users" VALUES('u-mgr-org-018','mgr-org-018','525352','manager','org-018',1);
INSERT INTO "users" VALUES('u-mgr-org-019','mgr-org-019','944757','manager','org-019',1);
INSERT INTO "users" VALUES('u-mgr-org-020','mgr-org-020','511923','manager','org-020',1);
INSERT INTO "users" VALUES('u-mgr-org-021','mgr-org-021','399687','manager','org-021',1);
INSERT INTO "users" VALUES('u-mgr-org-022','mgr-org-022','510083','manager','org-022',1);
INSERT INTO "users" VALUES('u-mgr-org-023','mgr-org-023','536051','manager','org-023',1);
INSERT INTO "users" VALUES('u-mgr-org-024','mgr-org-024','729880','manager','org-024',1);
INSERT INTO "users" VALUES('u-mgr-org-025','mgr-org-025','616580','manager','org-025',1);
INSERT INTO "users" VALUES('u-mgr-org-026','mgr-org-026','283480','manager','org-026',1);
INSERT INTO "users" VALUES('u-mgr-org-027','mgr-org-027','454792','manager','org-027',1);
INSERT INTO "users" VALUES('u-mgr-org-028','mgr-org-028','205269','manager','org-028',1);
INSERT INTO "users" VALUES('u-mgr-org-029','mgr-org-029','412304','manager','org-029',1);
INSERT INTO "users" VALUES('u-mgr-org-030','mgr-org-030','366446','manager','org-030',1);
INSERT INTO "users" VALUES('u-mgr-org-031','mgr-org-031','590784','manager','org-031',1);
INSERT INTO "users" VALUES('u-mgr-org-032','mgr-org-032','881799','manager','org-032',1);
INSERT INTO "users" VALUES('u-mgr-org-033','mgr-org-033','127865','manager','org-033',1);
INSERT INTO "users" VALUES('u-mgr-org-034','mgr-org-034','337683','manager','org-034',1);
INSERT INTO "users" VALUES('u-mgr-org-035','mgr-org-035','231212','manager','org-035',1);
