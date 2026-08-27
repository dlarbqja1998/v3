export type LegalDocument = {
	title: string;
	version: string;
	announcedDate: string;
	effectiveDate: string;
	sections: { title: string; paragraphs: string[] }[];
};

const common = { version: '1.0', announcedDate: '2026-08-28', effectiveDate: '2026-09-04' };

export const privacyPolicy: LegalDocument = {
	...common,
	title: '개인정보 처리방침',
	sections: [
		{ title: '개인정보의 처리 목적', paragraphs: ['골라바유 운영팀은 회원 식별, 서비스 제공, 문의 처리와 서비스 안전성 확보를 위해 개인정보를 처리합니다.'] },
		{ title: '처리하는 개인정보 항목', paragraphs: ['카카오 로그인 정보, 이메일, 닉네임, 프로필 이미지, 단과대, 학과, 학번, 성별, 문의 내용과 서비스 이용 과정에서 생성되는 접속 정보가 처리될 수 있습니다.'] },
		{ title: '보유 및 이용 기간', paragraphs: ['회원 정보와 회원에게 연결된 문의는 회원 탈퇴 시 삭제합니다. 관계 법령에 따라 보존이 필요한 정보가 생기는 경우 해당 근거와 기간을 별도로 고지합니다.'] },
		{ title: '개인정보의 제3자 제공', paragraphs: ['골라바유 운영팀은 이용자의 동의 또는 법적 근거 없이 개인정보를 제3자에게 제공하지 않습니다.'] },
		{ title: '외부 서비스 이용', paragraphs: ['서비스 운영에는 카카오 로그인, Cloudflare, Neon PostgreSQL이 사용됩니다. 문의 등록 알림에는 Discord가 사용되며 문의 번호, 유형, 제목, 내용 일부만 전송합니다.'] },
		{ title: '정보주체의 권리', paragraphs: ['사용자는 내 정보 수정, 문의하기와 회원 탈퇴를 통해 개인정보의 확인, 정정, 삭제를 요청할 수 있습니다.'] },
		{ title: '개인정보의 안전성 확보', paragraphs: ['접근 권한 제한, 비밀정보의 환경변수 분리, 암호화 통신 등 합리적인 보호 조치를 적용합니다.'] },
		{ title: '개인정보 보호 문의', paragraphs: ['운영 주체: 골라바유 운영팀', '연락처: dlarbqja1998@korea.ac.kr'] }
	]
};

export const termsOfService: LegalDocument = {
	...common,
	title: '서비스 이용약관',
	sections: [
		{ title: '목적', paragraphs: ['이 약관은 골라바유 운영팀이 제공하는 고려대학교 세종캠퍼스 생활정보 서비스 골라바유의 이용 조건과 운영팀 및 이용자의 권리·의무를 정합니다.'] },
		{ title: '서비스 내용', paragraphs: ['골라바유는 교내외 시설, 학식, 셔틀, 날씨, 공지와 문의 기능을 제공합니다. 제공 정보는 학교와 외부 제공처의 사정에 따라 실제 운영 내용과 다를 수 있습니다.'] },
		{ title: '계정 관리', paragraphs: ['이용자는 본인의 계정을 안전하게 관리해야 하며, 계정의 부정 사용을 발견한 경우 운영팀에 알려야 합니다.'] },
		{ title: '이용자의 의무', paragraphs: ['이용자는 다른 이용자의 권리를 침해하거나 서비스 운영을 방해하는 행위, 허위 문의 반복, 자동화된 과도한 요청, 관련 법령을 위반하는 행위를 해서는 안 됩니다.'] },
		{ title: '서비스 변경과 중단', paragraphs: ['운영상 또는 기술상 필요한 경우 서비스의 일부가 변경되거나 일시 중단될 수 있으며 중요한 변경은 공지사항으로 안내합니다.'] },
		{ title: '회원 탈퇴', paragraphs: ['이용자는 마이페이지에서 회원 탈퇴를 요청할 수 있습니다. 탈퇴가 완료되면 계정과 계정에 연결된 문의 데이터는 복구할 수 없도록 삭제됩니다.'] },
		{ title: '책임의 제한', paragraphs: ['운영팀은 정확한 정보 제공을 위해 노력하지만 학교 및 외부 제공처에서 수집한 정보의 실시간 정확성을 보증하지 않습니다. 이용자는 중요한 사항을 공식 채널에서 다시 확인해야 합니다.'] },
		{ title: '약관 변경', paragraphs: ['약관이 변경되면 적용일과 변경 내용을 공지사항으로 알립니다. 변경된 약관은 명시된 시행일부터 적용됩니다.'] },
		{ title: '문의', paragraphs: ['서비스 이용 관련 문의는 앱 내 문의하기 또는 dlarbqja1998@korea.ac.kr로 접수할 수 있습니다.'] }
	]
};
