/**
 * Shared front/back ID card layout. Used by both IdCardPreviewPage (one
 * student) and IdCardBulkPrintPage (a class/selection printed as a
 * single browser print job). Kept in one place deliberately — before
 * this was extracted, the front/back JSX lived only in
 * IdCardPreviewPage.jsx, which is exactly the kind of thing that quietly
 * drifts out of sync the first time someone tweaks one card design
 * without knowing a second copy exists.
 */
export function safe(value, fallback = '—') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

export function CardFront({ card }) {
  const { student, school } = card;
  return (
    <div className="id-card-inner">
      <div className="abs front-header" />
      <div className="abs front-logo-wrap">
        {school.logo_url ? <img src={school.logo_url} className="front-logo" alt="" /> : <div className="front-logo-placeholder">{safe(school.name, 'S').slice(0, 1).toUpperCase()}</div>}
      </div>
      <div className="abs front-school-name">{safe(school.name).toUpperCase()}</div>
      <div className="abs front-header-address">{safe(card.address_short)}</div>
      <div className="abs front-header-phone">{safe(school.phone)}</div>

      <div className="abs front-photo-frame">
        {student.photo_url ? <img src={student.photo_url} className="front-photo" alt="" /> : <div className="front-photo-placeholder">PHOTO</div>}
      </div>

      <div className="abs front-name">{safe(student.full_name).toUpperCase()}</div>
      <div className="abs front-name-rule" />
      <div className="abs front-role">STUDENT</div>

      <div className="abs front-fact-label" style={{ top: '68pt' }}>Adm No.</div>
      <div className="abs front-fact-value" style={{ top: '68pt' }}>{safe(student.admission_number)}</div>
      <div className="abs front-fact-label" style={{ top: '76pt' }}>Class</div>
      <div className="abs front-fact-value" style={{ top: '76pt' }}>{safe(card.class_name)}</div>
      <div className="abs front-fact-label" style={{ top: '84pt' }}>D.O.B.</div>
      <div className="abs front-fact-value" style={{ top: '84pt' }}>{safe(student.date_of_birth)}</div>

      <div className="abs front-session">{safe(card.session_name)}</div>
      {school.principal_signature_url ? <img src={school.principal_signature_url} className="abs front-signature-img" alt="" /> : null}
      <div className="abs front-signature-line" />
      <div className="abs front-signature-label">PRINCIPAL</div>

      <div className="abs front-footer">Issued {safe(card.issued_on)} &nbsp;•&nbsp; Property of {safe(school.name)}</div>
    </div>
  );
}

export function CardBack({ card }) {
  const { student, school } = card;
  return (
    <div className="id-card-inner">
      <div className="abs back-header">{safe(school.name).toUpperCase()}</div>
      <div className="abs back-pledge-title"><span>STUDENT CODE OF CONDUCT</span></div>
      <div className="abs back-pledge">As a student of {safe(school.name)}, I pledge to uphold the values of discipline, respect, honesty and hard work.</div>
      <div className="abs back-pledge-list">
        <div>• I will be punctual, diligent and respectful.</div>
        <div>• I will wear my uniform neatly at all times.</div>
        <div>• I will care for school property and the environment.</div>
      </div>
      <div className="abs back-emergency-title"><span>IN CASE OF EMERGENCY, CONTACT</span></div>
      <div className="abs back-emergency-label" style={{ top: '88pt' }}>Name</div>
      <div className="abs back-emergency-value" style={{ top: '88pt' }}>{safe(student.guardian_name)}</div>
      <div className="abs back-emergency-label" style={{ top: '96pt' }}>Phone</div>
      <div className="abs back-emergency-value" style={{ top: '96pt' }}>{safe(student.guardian_phone)}</div>
      <img src={card.qr_data_uri} className="abs back-qr" alt="Verification QR code" />
      <div className="abs back-qr-label">SCAN TO VERIFY</div>
      <div className="abs back-footer" />
      <div className="abs back-sign-cell-l"><div className="back-signature-line" /><div className="back-signature-label">HOLDER'S SIGNATURE</div></div>
      <div className="abs back-sign-divider" />
      <div className="abs back-sign-cell-r">
        {school.principal_signature_url ? <img src={school.principal_signature_url} className="back-signature-img" alt="" /> : <div className="back-signature-line" />}
        <div className="back-signature-label">PRINCIPAL'S SIGNATURE</div>
      </div>
      <div className="abs back-notice">This ID card must be presented on demand. Not transferable.</div>
    </div>
  );
}
