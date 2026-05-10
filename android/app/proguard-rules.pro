# Kotlinx serialization
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt

-keep,includedescriptorclasses class com.atlastx.capture.**$$serializer { *; }
-keepclassmembers class com.atlastx.capture.** {
    *** Companion;
}
-keepclasseswithmembers class com.atlastx.capture.** {
    kotlinx.serialization.KSerializer serializer(...);
}
