import { Authenticator, useTheme, View, Image, Text, Heading } from '@aws-amplify/ui-react'

const components = {
    Header() {
        const { tokens } = useTheme()

        return (
            <View textAlign="center" padding={tokens.space.large}>
                <View marginBottom={tokens.space.medium}>
                    <Text fontSize="3rem">🗳️</Text>
                </View>
                <Heading level={2} color={tokens.colors.font.primary}>
                    Welcome to Stotra
                </Heading>
                <Text color={tokens.colors.font.secondary} marginTop={tokens.space.xs}>
                    Secure elections powered by AWS
                </Text>
            </View>
        )
    },

    Footer() {
        const { tokens } = useTheme()

        return (
            <View textAlign="center" padding={tokens.space.medium}>
                <Text fontSize={tokens.fontSizes.small} color={tokens.colors.font.tertiary}>
                    🔒 Secured by AWS Cognito • Built with ❤️ for students
                </Text>
            </View>
        )
    },

    SignIn: {
        Header() {
            const { tokens } = useTheme()
            return (
                <Heading level={3} marginBottom={tokens.space.medium}>
                    Sign in to your account
                </Heading>
            )
        },
        Footer() {
            return (
                <View textAlign="center">
                    <Text variation="primary">
                        New to Stotra? Create an account to start voting
                    </Text>
                </View>
            )
        }
    },

    SignUp: {
        Header() {
            const { tokens } = useTheme()
            return (
                <Heading level={3} marginBottom={tokens.space.medium}>
                    Create your account
                </Heading>
            )
        },
        Footer() {
            return (
                <View textAlign="center">
                    <Text variation="primary">
                        Already have an account? Sign in to continue
                    </Text>
                </View>
            )
        }
    },

    ConfirmSignUp: {
        Header() {
            const { tokens } = useTheme()
            return (
                <Heading level={3} marginBottom={tokens.space.medium}>
                    Check your email
                </Heading>
            )
        },
        Footer() {
            return (
                <View textAlign="center">
                    <Text variation="primary">
                        We sent a verification code to your email address
                    </Text>
                </View>
            )
        }
    },

    ForgotPassword: {
        Header() {
            const { tokens } = useTheme()
            return (
                <Heading level={3} marginBottom={tokens.space.medium}>
                    Reset your password
                </Heading>
            )
        },
        Footer() {
            return (
                <View textAlign="center">
                    <Text variation="primary">
                        Enter your email to receive a reset code
                    </Text>
                </View>
            )
        }
    }
}

const formFields = {
    signIn: {
        username: {
            placeholder: 'Enter your email address',
            isRequired: true,
            label: 'Email Address',
            labelHidden: false
        },
        password: {
            placeholder: 'Enter your password',
            isRequired: true,
            label: 'Password',
            labelHidden: false
        }
    },
    signUp: {
        email: {
            placeholder: 'Enter your email address',
            isRequired: true,
            label: 'Email Address',
            labelHidden: false,
            order: 1
        },
        password: {
            placeholder: 'Create a secure password',
            isRequired: true,
            label: 'Password',
            labelHidden: false,
            order: 2
        },
        confirm_password: {
            placeholder: 'Confirm your password',
            isRequired: true,
            label: 'Confirm Password',
            labelHidden: false,
            order: 3
        }
    },
    forgotPassword: {
        username: {
            placeholder: 'Enter your email address',
            isRequired: true,
            label: 'Email Address'
        }
    },
    confirmResetPassword: {
        confirmation_code: {
            placeholder: 'Enter verification code',
            label: 'Verification Code',
            isRequired: true
        },
        password: {
            placeholder: 'Enter new password',
            label: 'New Password',
            isRequired: true
        },
        confirm_password: {
            placeholder: 'Confirm new password',
            label: 'Confirm New Password',
            isRequired: true
        }
    }
}

const services = {
    async validateCustomSignUp(formData) {
        if (!formData.email) {
            return {
                email: 'Email is required'
            }
        }
        if (!formData.email.includes('@')) {
            return {
                email: 'Please enter a valid email address'
            }
        }
        if (formData.password.length < 8) {
            return {
                password: 'Password must be at least 8 characters'
            }
        }
    }
}

function CustomAuthenticator({ children }) {
    return (
        <Authenticator
            formFields={formFields}
            components={components}
            services={services}
            hideSignUp={false}
            socialProviders={[]}
            variation="modal"
        >
            {children}
        </Authenticator>
    )
}

export default CustomAuthenticator