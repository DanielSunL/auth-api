/**
 * warranty.js
 * - 보증서 앞면 디자인(세로줄 4개) + 16자리 그룹 입력창
 * - 최초 화면: 단일 input에 4자리마다 하이픈 삽입하며 16자리 코드 입력
 * - 코드 검증 후 사용자 정보 입력 폼으로 전환
 */

document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById("warranty-registration");
  if (!container) return;

  /** =========================================
   * getModelList:
   * - /api/models 에 요청하여 모델명 배열을 받은 뒤,
   *   <datalist id="model-list">에 <option>들을 추가
   * ========================================= */
  function getModelList() {
    fetch("/api/models")
      .then((res) => res.json())
      .then((json) => {
        if (json.status === "success") {
          const models = json.data; // ["10CAM 우쿨렐레", ...]
          const dataList = document.getElementById("model-list");
          if (!dataList) return; // 아직 datalist가 없으면 아무것도 안 함

          models.forEach((modelName) => {
            const option = document.createElement("option");
            option.value = modelName;
            dataList.appendChild(option);
          });
        } else {
          console.error("모델 목록 로드 실패:", json.message);
        }
      })
      .catch((err) => {
        console.error("모델 목록 요청 오류:", err);
      });
  }

  /** =========================================
   * 1) 초기 화면: 보증서 상단 스트라이프 + 그룹 코드 입력창
   * ========================================= */
  function renderCodeInputUI() {
    container.innerHTML = "";

    // •─ 보증서 상단 스트라이프 (4개 세로줄) ─• 
    const stripeTop = document.createElement("div");
    stripeTop.className = "stripes-top";
    for (let i = 0; i < 4; i++) {
      const s = document.createElement("div");
      s.className = "stripe";
      stripeTop.appendChild(s);
    }
    container.appendChild(stripeTop);

    // •─ 제목 “정품 등록 코드 입력” ─• 
    const title = document.createElement("h1");
    title.textContent = "정품 등록 코드 입력";
    container.appendChild(title);

    // •─ 입력창 + 하이픈 자동 로직을 포함할 컨테이너 ─• 
    const inputContainer = document.createElement("div");
    inputContainer.className = "input-container";

    // (1) 그룹 코드 입력창 (단일 input)
    const codeInput = document.createElement("input");
    codeInput.type = "text";
    codeInput.id = "warranty-code-input";
    codeInput.maxLength = 19;
    codeInput.placeholder = "XXXX-XXXX-XXXX-XXXX";
    codeInput.autocapitalize = "characters";
    codeInput.addEventListener("input", onCodeInput);
    codeInput.addEventListener("keydown", onBackspaceKey);
    inputContainer.appendChild(codeInput);

    // (2) 오류 메시지
    const errorDiv = document.createElement("div");
    errorDiv.id = "error-code";
    inputContainer.appendChild(errorDiv);

    container.appendChild(inputContainer);

    // •─ 등록 혜택 안내 문구 ─• 
    const benefitsDiv = document.createElement("div");
    benefitsDiv.className = "benefits";
    benefitsDiv.innerHTML = `
      <b>정품 등록 혜택</b><br>
      1) 2년 무상 A/S (구매 후 30일 이내 등록 시 1년 + 추가 1년)<br>
      2) 공연·워크숍 초대권 발송<br>
      3) 할인 쿠폰 및 이벤트 정보 발송
    `;
    container.appendChild(benefitsDiv);

    // •─ “코드 확인” 버튼 및 로딩 텍스트 ─• 
    const btnWrapper = document.createElement("div");
    btnWrapper.className = "button-wrapper";
    const submitBtn = document.createElement("button");
    submitBtn.textContent = "코드 확인";
    submitBtn.addEventListener("click", verifyWarrantyCode);
    btnWrapper.appendChild(submitBtn);

    // 로딩 텍스트 (숨김)
    const loadingDiv = document.createElement("div");
    loadingDiv.id = "code-loading";
    loadingDiv.className = "loading-text";
    loadingDiv.style.display = "none";
    loadingDiv.textContent = "코드를 확인 중입니다...";
    btnWrapper.appendChild(loadingDiv);

    container.appendChild(btnWrapper);

    // •─ 보증서 하단 스트라이프 (4개 세로줄) ─• 
    const stripeBottom = document.createElement("div");
    stripeBottom.className = "stripes-bottom";
    for (let i = 0; i < 4; i++) {
      const s = document.createElement("div");
      s.className = "stripe";
      stripeBottom.appendChild(s);
    }
    container.appendChild(stripeBottom);

    // 첫 번째 칸 자동 포커스
    codeInput.focus();
  }

  /** =========================================
   * (핵심) onCodeInput:
   * ========================================= */
  function onCodeInput(e) {
    const input = e.target;
    let value = input.value.toUpperCase();

    // (1) 숫자/알파벳(영문) 외 모두 제거
    value = value.replace(/[^A-Z0-9]/g, "");
    // (2) 최대 16자리(코드)까지 자르기
    if (value.length > 16) {
      value = value.slice(0, 16);
    }

    // (3) 4자리마다 하이픈 붙이기
    const parts = [];
    for (let i = 0; i < value.length; i += 4) {
      parts.push(value.slice(i, i + 4));
    }
    input.value = parts.join("-");

    // (4) 커서 위치를 끝으로 보내기
    const len = input.value.length;
    input.setSelectionRange(len, len);
  }

  /** =========================================
   * Backspace 처리:
   * ========================================= */
  function onBackspaceKey(e) {
    const input = e.target;
    if (e.key !== "Backspace") return;
    if (!input.value) return;

    const pos = input.selectionStart;
    if (pos && input.value[pos - 1] === "-") {
      e.preventDefault();
      input.setSelectionRange(pos - 1, pos - 1);
      setTimeout(() => onCodeInput({ target: input }), 0);
    }
  }

  /** =========================================
   * verifyWarrantyCode:
   * ========================================= */
  function verifyWarrantyCode() {
    const input = document.getElementById("warranty-code-input");
    const errorDiv = document.getElementById("error-code");
    errorDiv.textContent = "";

    // (1) 하이픈 제거된 순수 코드(16자리) 추출
    const raw = input.value.replace(/-/g, "").trim();

    // (2) 길이 16자리 체크
    if (raw.length !== 16) {
      errorDiv.textContent = "유효한 16자리 영문/숫자 조합 코드를 입력해 주세요.";
      return;
    }

    // (3) “C U K E” 패리티체크 검증
    const groups = input.value.split("-");
    if (
      groups.length !== 4 ||
      groups[0].length !== 4 ||
      groups[1].length !== 4 ||
      groups[2].length !== 4 ||
      groups[3].length !== 4 ||
      groups[0].charAt(3) !== "C" ||
      groups[1].charAt(3) !== "U" ||
      groups[2].charAt(3) !== "K" ||
      groups[3].charAt(3) !== "E"
    ) {
      errorDiv.textContent = "코드 형식이 올바르지 않습니다. 다시 확인해 주세요.";
      return;
    }

    // (4) 서버 검증 시작
    const loadingDiv = document.getElementById("code-loading");
    loadingDiv.style.display = "block";
    document.querySelectorAll("#warranty-code-input, .button-wrapper button").forEach((el) => (el.disabled = true));

    fetch("/api/warranty/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ warrantyCode: raw }),
    })
      .then((res) => res.json())
      .then((data) => {
        loadingDiv.style.display = "none";
        document.querySelectorAll("#warranty-code-input, .button-wrapper button").forEach((el) => (el.disabled = false));

        if (data.status === "success") {
          renderRegistrationForm(raw);
        } else {
          errorDiv.textContent = data.message || "유효하지 않은 코드입니다.";
        }
      })
      .catch((err) => {
        console.error(err);
        loadingDiv.style.display = "none";
        document.querySelectorAll("#warranty-code-input, .button-wrapper button").forEach((el) => (el.disabled = false));
        errorDiv.textContent = "서버 통신 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
      });
  }

  /** =========================================
   * 2) 사용자 정보 입력 폼 렌더링 (코드 검증 후 호출)
   * ========================================= */
  function renderRegistrationForm(verifiedCode) {
    container.innerHTML = "";

    // ─────────────────────────────────────
    // ① “제품 모델명 자동완성”을 위해 datalist가 생성된 직후에 모델 목록을 불러옴
    //    (이 위치에서 getModelList를 호출해야 datalist#model-list가 DOM에 존재함)
    getModelList();
    // ─────────────────────────────────────

    // (1) 제목 “정품 등록 정보 입력”
    const title = document.createElement("h1");
    title.textContent = "정품 등록 정보 입력";
    title.style.textAlign = "center";
    title.style.fontSize = "1.5rem";
    title.style.marginBottom = "16px";
    container.appendChild(title);

    // (2) 폼 전체 래퍼
    const form = document.createElement("form");
    form.className = "registration-form";
    form.style.display = "flex";
    form.style.flexDirection = "column";
    form.style.gap = "12px";

    // (3) 성명
    const labelName = document.createElement("label");
    labelName.setAttribute("for", "customerName");
    labelName.textContent = "성명";
    form.appendChild(labelName);

    const inputName = document.createElement("input");
    inputName.type = "text";
    inputName.id = "customerName";
    inputName.name = "customerName";
    inputName.placeholder = "홍길동";
    inputName.required = true;
    form.appendChild(inputName);

    const errorName = document.createElement("div");
    errorName.id = "errorName";
    errorName.className = "error-message";
    form.appendChild(errorName);

    // (4) 연락처
    const labelPhone = document.createElement("label");
    labelPhone.setAttribute("for", "customerPhone");
    labelPhone.textContent = "연락처";
    form.appendChild(labelPhone);

    const inputPhone = document.createElement("input");
    inputPhone.type = "tel";
    inputPhone.id = "customerPhone";
    inputPhone.name = "customerPhone";
    inputPhone.placeholder = "010-1234-5678";
    inputPhone.required = true;
    inputPhone.addEventListener("input", formatPhoneNumber);
    form.appendChild(inputPhone);

    const errorPhone = document.createElement("div");
    errorPhone.id = "errorPhone";
    errorPhone.className = "error-message";
    form.appendChild(errorPhone);

    // (5) 이메일
    const labelEmail = document.createElement("label");
    labelEmail.setAttribute("for", "customerEmail");
    labelEmail.textContent = "이메일";
    form.appendChild(labelEmail);

    const inputEmail = document.createElement("input");
    inputEmail.type = "email";
    inputEmail.id = "customerEmail";
    inputEmail.name = "customerEmail";
    inputEmail.placeholder = "example@domain.com";
    inputEmail.required = true;
    form.appendChild(inputEmail);

    const errorEmail = document.createElement("div");
    errorEmail.id = "errorEmail";
    errorEmail.className = "error-message";
    form.appendChild(errorEmail);

    // (6) 구매일
    const labelDate = document.createElement("label");
    labelDate.setAttribute("for", "purchaseDate");
    labelDate.textContent = "구매일";
    form.appendChild(labelDate);

    const inputDate = document.createElement("input");
    inputDate.type = "date";
    inputDate.id = "purchaseDate";
    inputDate.name = "purchaseDate";
    inputDate.required = true;
    form.appendChild(inputDate);

    const errorDate = document.createElement("div");
    errorDate.id = "errorDate";
    errorDate.className = "error-message";
    form.appendChild(errorDate);

    // (7) 구매처
    const labelPlace = document.createElement("label");
    labelPlace.setAttribute("for", "purchasePlace");
    labelPlace.textContent = "구매처";
    form.appendChild(labelPlace);

    const selectPlace = document.createElement("select");
    selectPlace.id = "purchasePlace";
    selectPlace.name = "purchasePlace";
    selectPlace.required = true;

    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = "구매처를 선택하세요";
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    selectPlace.appendChild(placeholderOption);

    const option1 = document.createElement("option");
    option1.value = "countess_official";
    option1.textContent = "카운티스 공식몰";
    selectPlace.appendChild(option1);

    const option2 = document.createElement("option");
    option2.value = "smartstore";
    option2.textContent = "온라인 구매";
    selectPlace.appendChild(option2);

    const option3 = document.createElement("option");
    option3.value = "other_retailer";
    option3.textContent = "악기점 매장";
    selectPlace.appendChild(option3);

    form.appendChild(selectPlace);

    const errorPlace = document.createElement("div");
    errorPlace.id = "errorPlace";
    errorPlace.className = "error-message";
    form.appendChild(errorPlace);

    // (8) 주소
    const labelAddress = document.createElement("label");
    labelAddress.setAttribute("for", "customerAddress");
    labelAddress.textContent = "주소";
    form.appendChild(labelAddress);

    const inputAddress = document.createElement("input");
    inputAddress.type = "text";
    inputAddress.id = "customerAddress";
    inputAddress.name = "customerAddress";
    inputAddress.placeholder = "예) 서울시 강남구 압구정로34길 23-302";
    inputAddress.required = true;
    form.appendChild(inputAddress);

    const errorAddress = document.createElement("div");
    errorAddress.id = "errorAddress";
    errorAddress.className = "error-message";
    form.appendChild(errorAddress);

    // (9) 제품 모델명 (datalist 연결)
    const labelModel = document.createElement("label");
    labelModel.setAttribute("for", "productModel");
    labelModel.textContent = "제품 모델명 (선택)";
    form.appendChild(labelModel);

    const dataList = document.createElement("datalist");
    dataList.id = "model-list"; 
    // ‣ 이 시점에 이미 DOM에 추가되므로, getModelList() 상황에서 옵션을 채워 줄 수 있음

    const inputModel = document.createElement("input");
    inputModel.type = "text";
    inputModel.id = "productModel";
    inputModel.name = "productModel";
    inputModel.placeholder = "모델명을 선택하거나 직접 입력";
    inputModel.setAttribute("list", "model-list");
    form.appendChild(inputModel);
    form.appendChild(dataList);

    // (10) 기타 요청사항
    const labelNotes = document.createElement("label");
    labelNotes.setAttribute("for", "notes");
    labelNotes.textContent = "기타 요청사항 (선택)";
    form.appendChild(labelNotes);

    const textareaNotes = document.createElement("textarea");
    textareaNotes.id = "notes";
    textareaNotes.name = "notes";
    textareaNotes.placeholder = "예) 선물용으로 사용합니다.";
    textareaNotes.style.resize = "vertical";
    textareaNotes.style.minHeight = "60px";
    form.appendChild(textareaNotes);

    // (11) 약관 동의 체크박스
    const termsWrapper = document.createElement("div");
    termsWrapper.className = "terms-wrapper";
    termsWrapper.style.display = "flex";
    termsWrapper.style.alignItems = "center";
    termsWrapper.style.gap = "8px";
    termsWrapper.style.marginTop = "8px";
    termsWrapper.style.marginBottom = "8px";

    const checkboxTerms = document.createElement("input");
    checkboxTerms.type = "checkbox";
    checkboxTerms.id = "agreeTerms";
    checkboxTerms.name = "agreeTerms";
    checkboxTerms.required = true;
    termsWrapper.appendChild(checkboxTerms);

    const termsLabel = document.createElement("label");
    termsLabel.setAttribute("for", "agreeTerms");
    termsLabel.innerHTML =
      "개인정보 처리방침 및 <a href=\"/terms/privacy\" target=\"_blank\">보증등록 약관</a>에 동의합니다. (필수)";
    termsWrapper.appendChild(termsLabel);

    form.appendChild(termsWrapper);

    const errorTerms = document.createElement("div");
    errorTerms.id = "errorTerms";
    errorTerms.className = "error-message";
    form.appendChild(errorTerms);

    // (12) 제출 버튼
    const submitBtn = document.createElement("button");
    submitBtn.type = "button";
    submitBtn.textContent = "등록하기";
    submitBtn.style.marginTop = "12px";
    form.appendChild(submitBtn);

    // 로딩 텍스트 (숨김)
    const registerLoading = document.createElement("div");
    registerLoading.id = "registerLoading";
    registerLoading.className = "loading-text";
    registerLoading.style.display = "none";
    registerLoading.textContent = "정보를 등록 중입니다...";
    form.appendChild(registerLoading);

    // 성공 메시지 (숨김)
    const successMsg = document.createElement("div");
    successMsg.id = "successMessage";
    successMsg.className = "success-message";
    successMsg.style.display = "none";
    successMsg.textContent = "정품 등록이 정상적으로 완료되었습니다. 감사합니다.";
    form.appendChild(successMsg);

    container.appendChild(form);

    // 보증서 하단 스트라이프
    const stripeBottom = document.createElement("div");
    stripeBottom.className = "stripes-bottom";
    for (let i = 0; i < 4; i++) {
      const s = document.createElement("div");
      s.className = "stripe";
      stripeBottom.appendChild(s);
    }
    container.appendChild(stripeBottom);

    // “등록하기” 클릭 시 처리
    submitBtn.addEventListener("click", function () {
      if (!validateRegistrationForm()) return;

      submitBtn.disabled = true;
      registerLoading.style.display = "block";

      const payload = {
        warrantyCode: verifiedCode,
        customerName: inputName.value.trim(),
        customerPhone: inputPhone.value.trim(),
        customerEmail: inputEmail.value.trim(),
        purchaseDate: inputDate.value,
        purchasePlace: selectPlace.value,
        customerAddress: inputAddress.value.trim(),
        productModel: inputModel.value.trim(),
        notes: textareaNotes.value.trim(),
        agreeTerms: checkboxTerms.checked,
      };

      fetch("/api/warranty/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((res) => res.json())
        .then((result) => {
          registerLoading.style.display = "none";
          submitBtn.disabled = false;

          if (result.status === "success") {
            successMsg.style.display = "block";
            form.querySelectorAll("input, select, textarea, button").forEach((el) => (el.disabled = true));
          } else {
            alert(result.message || "등록 중 오류가 발생했습니다.");
          }
        })
        .catch((err) => {
          console.error(err);
          registerLoading.style.display = "none";
          submitBtn.disabled = false;
          alert("서버 통신 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
        });
    });

    /** 입력 유효성 검사 함수 */
    function validateRegistrationForm() {
      let isValid = true;

      if (inputName.value.trim() === "") {
        errorName.textContent = "성함을 입력해 주세요.";
        isValid = false;
      } else {
        errorName.textContent = "";
      }

      const phonePattern = /^0\d{1,2}-\d{3,4}-\d{4}$/;
      const phoneValue = document.getElementById("customerPhone").value.trim();
      if (!phonePattern.test(phoneValue)) {
        errorPhone.textContent = "유효한 연락처 형식(예: 010-1234-5678)으로 입력해 주세요.";
        isValid = false;
      } else {
        errorPhone.textContent = "";
      }

      if (inputEmail.value.trim() === "") {
        errorEmail.textContent = "이메일을 입력해 주세요.";
        isValid = false;
      } else {
        errorEmail.textContent = "";
      }

      if (inputDate.value === "") {
        errorDate.textContent = "구매일을 선택해 주세요.";
        isValid = false;
      } else {
        errorDate.textContent = "";
      }

      if (selectPlace.value === "") {
        errorPlace.textContent = "구매처를 선택해 주세요.";
        isValid = false;
      } else {
        errorPlace.textContent = "";
      }

      if (inputAddress.value.trim() === "") {
        errorAddress.textContent = "주소를 입력해 주세요.";
        isValid = false;
      } else {
        errorAddress.textContent = "";
      }

      if (!checkboxTerms.checked) {
        errorTerms.textContent = "약관 동의는 필수입니다.";
        isValid = false;
      } else {
        errorTerms.textContent = "";
      }

      return isValid;
    }
  }

  /** =========================================
   * formatPhoneNumber 함수 (연락처 하이픈 자동 삽입)
   * ========================================= */
  function formatPhoneNumber(e) {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length < 4) {
      e.target.value = value;
    } else if (value.length < 7) {
      e.target.value = value.slice(0, 3) + "-" + value.slice(3);
    } else {
      e.target.value = value.slice(0, 3) + "-" + value.slice(3, 7) + "-" + value.slice(7);
    }
  }

  // 최초 렌더링 호출: “코드 입력 화면”만 그려 줌
  renderCodeInputUI();

  // ================
  // **주의**: 모델 목록은 renderRegistrationForm 내부에서 호출됩니다.
  // 여기서 getModelList()를 호출하면, 아직 datalist#model-list가 없어서 작동하지 않습니다.
  // ================
});
