--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: enum_trades_order_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_trades_order_type AS ENUM (
    'market',
    'limit',
    'stop_loss',
    'take_profit'
);


ALTER TYPE public.enum_trades_order_type OWNER TO postgres;

--
-- Name: enum_trades_outcome; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_trades_outcome AS ENUM (
    'win',
    'loss',
    'draw'
);


ALTER TYPE public.enum_trades_outcome OWNER TO postgres;

--
-- Name: enum_trades_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_trades_status AS ENUM (
    'pending',
    'completed',
    'cancelled',
    'failed'
);


ALTER TYPE public.enum_trades_status OWNER TO postgres;

--
-- Name: enum_trades_trade_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_trades_trade_type AS ENUM (
    'buy',
    'sell'
);


ALTER TYPE public.enum_trades_trade_type OWNER TO postgres;

--
-- Name: enum_transactions_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_transactions_status AS ENUM (
    'pending',
    'completed',
    'failed',
    'cancelled'
);


ALTER TYPE public.enum_transactions_status OWNER TO postgres;

--
-- Name: enum_transactions_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_transactions_type AS ENUM (
    'deposit',
    'withdrawal',
    'trade',
    'fee',
    'bonus'
);


ALTER TYPE public.enum_transactions_type OWNER TO postgres;

--
-- Name: enum_users_kyc_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_users_kyc_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE public.enum_users_kyc_status OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_actions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_actions (
    id uuid NOT NULL,
    admin_id uuid NOT NULL,
    action_type character varying(255) NOT NULL,
    target_user_id uuid,
    details jsonb NOT NULL,
    ip_address character varying(255)
);


ALTER TABLE public.admin_actions OWNER TO postgres;

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    full_name character varying(255),
    phone character varying(255),
    country character varying(255),
    date_of_birth timestamp with time zone,
    kyc_documents jsonb,
    trading_preferences jsonb,
    notification_settings jsonb,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.profiles OWNER TO postgres;

--
-- Name: trade_outcome_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trade_outcome_logs (
    id uuid NOT NULL,
    admin_id uuid NOT NULL,
    user_id uuid NOT NULL,
    previous_mode character varying(255) NOT NULL,
    new_mode character varying(255) NOT NULL,
    applies_to character varying(255) NOT NULL,
    reason text
);


ALTER TABLE public.trade_outcome_logs OWNER TO postgres;

--
-- Name: trades; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trades (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    trading_pair character varying(255) NOT NULL,
    trade_type public.enum_trades_trade_type NOT NULL,
    order_type public.enum_trades_order_type NOT NULL,
    amount numeric(20,8) NOT NULL,
    price numeric(20,8) NOT NULL,
    total_value numeric(20,8) NOT NULL,
    status public.enum_trades_status DEFAULT 'pending'::public.enum_trades_status,
    outcome public.enum_trades_outcome,
    profit_loss numeric(20,8),
    forced_outcome boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.trades OWNER TO postgres;

--
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    type public.enum_transactions_type NOT NULL,
    amount numeric(20,8) NOT NULL,
    currency character varying(255) NOT NULL,
    status public.enum_transactions_status DEFAULT 'pending'::public.enum_transactions_status,
    reference character varying(255),
    description text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    email character varying(255) NOT NULL,
    full_name character varying(255),
    avatar_url character varying(255),
    is_admin boolean DEFAULT false,
    is_verified boolean DEFAULT false,
    kyc_status public.enum_users_kyc_status DEFAULT 'pending'::public.enum_users_kyc_status,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: wallets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wallets (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    currency character varying(255) NOT NULL,
    balance numeric(20,8) DEFAULT 0,
    locked_balance numeric(20,8) DEFAULT 0,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.wallets OWNER TO postgres;

--
-- Data for Name: admin_actions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_actions (id, admin_id, action_type, target_user_id, details, ip_address) FROM stdin;
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.profiles (id, user_id, full_name, phone, country, date_of_birth, kyc_documents, trading_preferences, notification_settings, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: trade_outcome_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.trade_outcome_logs (id, admin_id, user_id, previous_mode, new_mode, applies_to, reason) FROM stdin;
\.


--
-- Data for Name: trades; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.trades (id, user_id, trading_pair, trade_type, order_type, amount, price, total_value, status, outcome, profit_loss, forced_outcome, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transactions (id, user_id, type, amount, currency, status, reference, description, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, full_name, avatar_url, is_admin, is_verified, kyc_status, created_at, updated_at) FROM stdin;
86e8f037-3f9a-4364-9ed1-4bccafb638f3	admin@kryvex.com	Admin User	\N	t	t	approved	2025-07-30 21:19:35.369+07	2025-07-30 21:19:35.369+07
d953e1d7-4444-4563-bc77-296afeb01fc0	trader1@example.com	John Trader	\N	f	t	approved	2025-07-30 21:19:35.381+07	2025-07-30 21:19:35.381+07
\.


--
-- Data for Name: wallets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wallets (id, user_id, currency, balance, locked_balance, created_at, updated_at) FROM stdin;
\.


--
-- Name: admin_actions admin_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_actions
    ADD CONSTRAINT admin_actions_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: trade_outcome_logs trade_outcome_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trade_outcome_logs
    ADD CONSTRAINT trade_outcome_logs_pkey PRIMARY KEY (id);


--
-- Name: trades trades_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_email_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key1 UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: wallets wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_pkey PRIMARY KEY (id);


--
-- Name: admin_actions admin_actions_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_actions
    ADD CONSTRAINT admin_actions_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: admin_actions admin_actions_target_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_actions
    ADD CONSTRAINT admin_actions_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public.users(id);


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: trade_outcome_logs trade_outcome_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trade_outcome_logs
    ADD CONSTRAINT trade_outcome_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: trade_outcome_logs trade_outcome_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trade_outcome_logs
    ADD CONSTRAINT trade_outcome_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: trades trades_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: transactions transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: wallets wallets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

