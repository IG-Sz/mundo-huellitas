import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

/**
 * Scroll de formularios que deja el campo con foco por encima del teclado.
 */
export default function FormularioScroll({
    children,
    contentContainerStyle,
    style,
    showsVerticalScrollIndicator = false,
}) {
    return (
        <KeyboardAwareScrollView
            style={[{ flex: 1 }, style]}
            contentContainerStyle={contentContainerStyle}
            enableOnAndroid
            enableAutomaticScroll
            extraHeight={24}
            extraScrollHeight={24}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={showsVerticalScrollIndicator}
            enableResetScrollToCoords={false}
        >
            {children}
        </KeyboardAwareScrollView>
    );
}
