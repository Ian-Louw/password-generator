import streamlit as st
from generator import generate_password
from hasher import hash_password
from strength import evaluate_strength

st.set_page_config(
    page_title="Password Generator",
    page_icon="🔐",
    layout="centered",
)

st.title("Password Generator & bcrypt Hasher")
st.caption("Generate secure passwords and bcrypt hashes.")

tab1, tab2 = st.tabs(["Generate Password", "Hash Your Own Password"])

# ── Tab 1: Generate Password ──────────────────────────────────────────────────

with tab1:
    st.sidebar.header("Password Settings")
    length = st.sidebar.slider("Length", min_value=8, max_value=128, value=16)
    use_upper = st.sidebar.checkbox("Uppercase (A-Z)", value=True)
    use_lower = st.sidebar.checkbox("Lowercase (a-z)", value=True)
    use_digits = st.sidebar.checkbox("Numbers (0-9)", value=True)
    use_symbols = st.sidebar.checkbox("Symbols (!@#$...)", value=True)

    if not any([use_upper, use_lower, use_digits, use_symbols]):
        st.error("Select at least one character type.")
    else:
        if "generated_password" not in st.session_state:
            st.session_state.generated_password = generate_password(
                length=length,
                uppercase=use_upper,
                lowercase=use_lower,
                digits=use_digits,
                symbols=use_symbols,
            )

        if st.button("Generate New Password", type="primary"):
            st.session_state.generated_password = generate_password(
                length=length,
                uppercase=use_upper,
                lowercase=use_lower,
                digits=use_digits,
                symbols=use_symbols,
            )

        password = st.session_state.generated_password

        # Password display
        st.subheader("Your Password")
        st.code(password, language=None)

        # Strength meter
        result = evaluate_strength(password)
        st.markdown(f"**Strength: {result['label']}**")
        st.progress(result["score"] / 100)
        st.markdown(
            f"<div style='height:6px;background:{result['color']};border-radius:3px;margin-top:-20px'></div>",
            unsafe_allow_html=True,
        )

        # bcrypt hash
        hashed = hash_password(password)
        st.subheader("bcrypt Hash")
        st.code(hashed, language=None)

# ── Tab 2: Hash Your Own Password ─────────────────────────────────────────────

with tab2:
    st.subheader("Hash Your Own Password")
    user_password = st.text_input(
        "Enter a password to hash",
        type="password",
        placeholder="Type or paste a password...",
    )

    if st.button("Hash It", type="primary", key="hash_btn"):
        if user_password:
            # Strength meter
            result = evaluate_strength(user_password)
            st.markdown(f"**Strength: {result['label']}**")
            st.progress(result["score"] / 100)
            st.markdown(
                f"<div style='height:6px;background:{result['color']};border-radius:3px;margin-top:-20px'></div>",
                unsafe_allow_html=True,
            )

            # bcrypt hash
            hashed = hash_password(user_password)
            st.subheader("bcrypt Hash")
            st.code(hashed, language=None)
        else:
            st.warning("Please enter a password first.")
